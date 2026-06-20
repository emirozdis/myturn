// scripts/migrate-to-r2.js

try {
  // Explicitly load .env and .env.local variables if not already injected
  require("dotenv").config({ path: ".env.local" });
  require("dotenv").config();
} catch (e) {
  // Safely ignore if dotenv is not available in the current environment
}

const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const readline = require("readline");

// 1. Initialize S3 Client using local environment variables
const accountId = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || "").trim();
const accessKeyId = (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "").trim();
const secretAccessKey = (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "").trim();
const singleBucketName = (process.env.CLOUDFLARE_R2_BUCKET_NAME || "").trim();
const concurrencyLimit = parseInt(process.env.CONCURRENCY_LIMIT || "5", 10);

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Generates authorization headers.
 * We must use exactly one set of non-duplicated standard headers. Providing multiple casing
 * variants (e.g. "Authorization" and "authorization") causes Node fetch to merge them into a comma-separated list
 * (e.g., "Bearer token, Bearer token"), triggering an "Invalid Compact JWS" error at the gateway.
 */
function getAuthHeaders(serviceRoleKey) {
  return {
    "Authorization": `Bearer ${serviceRoleKey}`,
    "apikey": serviceRoleKey,
  };
}

/**
 * Limit-based promise pool execution helper to run async tasks in parallel.
 */
async function runWithConcurrency(tasks, limit) {
  const results = [];
  const executing = new Set();

  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    executing.add(p);

    const clean = () => executing.delete(p);
    p.then(clean, clean);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

/**
 * Format bytes into a human-readable string.
 */
function formatBytes(bytes) {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return "unknown size";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Prompts the user for console interaction approval.
 */
function askForApproval(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

/**
 * Maps bucket and file keys based on your single bucket prefix configuration.
 */
function getBucketAndKey(bucketParam, keyParam) {
  if (singleBucketName) {
    const cleanKey = keyParam.startsWith("/") ? keyParam.substring(1) : keyParam;
    return {
      bucket: singleBucketName,
      key: `${bucketParam}/${cleanKey}`,
    };
  }
  return {
    bucket: bucketParam,
    key: keyParam,
  };
}

/**
 * Checks if a file already exists in Cloudflare R2.
 * Returns file metadata (including ContentLength) if it exists, or null if it doesn't.
 */
async function getR2ObjectMetadata(bucketParam, keyParam) {
  const { bucket, key } = getBucketAndKey(bucketParam, keyParam);
  const command = new HeadObjectCommand({ Bucket: bucket, Key: key });

  try {
    const metadata = await s3Client.send(command);
    return metadata;
  } catch (err) {
    // Cloudflare returns a 404 (NotFound) error if the file is missing
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    // Throw other errors (like invalid credentials or connection issues) to stop the script
    throw err;
  }
}

/**
 * Uploads a file buffer directly to Cloudflare R2.
 */
async function uploadToR2(bucketParam, keyParam, body, contentType) {
  const { bucket, key } = getBucketAndKey(bucketParam, keyParam);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType || "application/octet-stream",
  });
  await s3Client.send(command);
}

/**
 * Fetch all buckets from Supabase Storage REST API
 */
async function getSupabaseBuckets(supabaseUrl, serviceRoleKey) {
  const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    headers: getAuthHeaders(serviceRoleKey),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch buckets: ${response.status} ${response.statusText} - ${errText}`);
  }
  return response.json();
}

/**
 * Recursively list all files within a Supabase storage bucket via REST API
 */
async function listAllFilesFromBucket(supabaseUrl, serviceRoleKey, bucketId, prefix = "") {
  let files = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/list/${bucketId}`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(serviceRoleKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prefix: prefix,
        limit: limit,
        offset: offset,
        sortBy: { column: "name", order: "asc" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Failed to list files in bucket ${bucketId} with prefix "${prefix}": ${response.status} ${response.statusText} - ${errText}`
      );
    }

    const batch = await response.json();
    if (!batch || batch.length === 0) {
      break;
    }

    for (const item of batch) {
      const fullPath = prefix ? `${prefix}${item.name}` : item.name;

      // If item has no id, it is a directory path, so we recurse recursively
      if (item.id === undefined || item.id === null) {
        const subfolderFiles = await listAllFilesFromBucket(
          supabaseUrl,
          serviceRoleKey,
          bucketId,
          `${fullPath}/`
        );
        files.push(...subfolderFiles);
      } else {
        // It is a file, collect metadata
        files.push({
          name: fullPath,
          id: item.id,
          size: item.metadata?.size,
        });
      }
    }

    if (batch.length < limit) {
      break;
    }
    offset += limit;
  }
  return files;
}

async function main() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!serviceRoleKey) {
    console.error("Error: Missing SUPABASE_SERVICE_ROLE_KEY in environment.");
    process.exit(1);
  }

  console.log("[Migration] Querying local Supabase storage catalog via REST API...");

  let buckets = [];
  try {
    buckets = await getSupabaseBuckets(supabaseUrl, serviceRoleKey);
  } catch (err) {
    console.error("[Migration] Error fetching buckets from Supabase:", err.message || err);
    process.exit(1);
  }

  if (!buckets || buckets.length === 0) {
    console.log("No storage buckets found in local Supabase storage.");
    return;
  }

  console.log(`[Migration] Found ${buckets.length} bucket(s). Listing all files...`);

  let objects = [];
  for (const bucket of buckets) {
    try {
      console.log(`[Migration] Listing files in bucket: ${bucket.id}...`);
      const files = await listAllFilesFromBucket(supabaseUrl, serviceRoleKey, bucket.id);
      console.log(`[Migration] Found ${files.length} file(s) in bucket: ${bucket.id}`);
      
      for (const file of files) {
        objects.push({
          name: file.name,
          bucket_id: bucket.id,
          size: file.size,
        });
      }
    } catch (err) {
      console.error(`[Migration] Error listing files for bucket ${bucket.id}:`, err.message || err);
    }
  }

  if (objects.length === 0) {
    console.log("No files found in local Supabase storage buckets.");
    return;
  }

  console.log(`[Migration] Found ${objects.length} files in Supabase. Checking R2 status...`);
  
  const toTransfer = [];
  const toSkip = [];

  // Check R2 presence in parallel
  await Promise.all(
    objects.map(async (obj) => {
      try {
        const existingMetadata = await getR2ObjectMetadata(obj.bucket_id, obj.name);
        if (existingMetadata) {
          toSkip.push(obj);
        } else {
          toTransfer.push(obj);
        }
      } catch (err) {
        console.error(`[Warning] Failed to check R2 metadata for ${obj.bucket_id}/${obj.name}:`, err.message || err);
        // Fallback to transfer if check fails
        toTransfer.push(obj);
      }
    })
  );

  console.log("\n=========================================");
  console.log("       PROPOSED MIGRATION SUMMARY        ");
  console.log("=========================================\n");

  if (toTransfer.length > 0) {
    console.log(`The following files will be TRANSFERRED (${toTransfer.length}):`);
    for (const file of toTransfer) {
      console.log(`  [+] ${file.bucket_id}/${file.name} (${formatBytes(file.size)})`);
    }
  } else {
    console.log("No new files to transfer.");
  }

  console.log("");

  if (toSkip.length > 0) {
    console.log(`The following files will be SKIPPED (already exist in R2) (${toSkip.length}):`);
    for (const file of toSkip) {
      console.log(`  [-] ${file.bucket_id}/${file.name} (Already in R2)`);
    }
  }

  console.log("\n-----------------------------------------");
  console.log(`Summary:`);
  console.log(`  - To Transfer: ${toTransfer.length} file(s)`);
  console.log(`  - To Skip:     ${toSkip.length} file(s)`);
  console.log(`  - Concurrency: ${concurrencyLimit} simultaneous thread(s)`);
  console.log("-----------------------------------------\n");

  if (toTransfer.length === 0) {
    console.log("Nothing to transfer. Migration complete!");
    return;
  }

  const answer = await askForApproval("Do you want to proceed with transferring these files? (y/N): ");
  
  if (answer !== "y" && answer !== "yes") {
    console.log("\n[Migration] Aborted by user.");
    return;
  }

  console.log(`\n[Migration] Starting transfers with ${concurrencyLimit} concurrent workers...`);
  let successCount = 0;
  let failureCount = 0;

  // Build concurrent upload tasks
  const uploadTasks = toTransfer.map((clip) => {
    return async () => {
      const cleanPath = clip.name;
      const bucket = clip.bucket_id;

      try {
        console.log(`[Migration] [Start]   ${bucket}/${cleanPath}...`);

        // 1. Fetch file directly from local offline Supabase instance
        const fetchUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${cleanPath}`;
        
        const response = await fetch(fetchUrl, {
          headers: getAuthHeaders(serviceRoleKey),
        });

        if (!response.ok) {
          console.error(
            `[Migration] [Failed]  Download error ${bucket}/${cleanPath}: ${response.status} ${response.statusText}`
          );
          failureCount++;
          return;
        }

        // 2. Extract binary payload and content headers
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get("content-type") || "application/octet-stream";

        // 3. Dispatch straight up to Cloudflare R2
        await uploadToR2(bucket, cleanPath, buffer, contentType);
        console.log(`[Migration] [Success] Migrated ${bucket}/${cleanPath} to R2.`);
        successCount++;
      } catch (err) {
        console.error(
          `[Migration] [Failed]  Error migrating ${bucket}/${cleanPath}:`,
          err.message || err
        );
        failureCount++;
      }
    };
  });

  // Run tasks within our custom limit-based concurrency pool
  await runWithConcurrency(uploadTasks, concurrencyLimit);

  console.log("\n[Migration] Finished!");
  console.log(`- Total files processed: ${objects.length}`);
  console.log(`- Successful migrations: ${successCount}`);
  console.log(`- Skipped (already existed): ${toSkip.length}`);
  console.log(`- Failed migrations: ${failureCount}`);
}

main().catch((e) => {
  console.error("Critical migration error:", e);
  process.exit(1);
});