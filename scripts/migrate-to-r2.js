// ./scripts/migrate-local.js

const { PrismaClient } = require("@prisma/client");
const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");

// 1. Initialize S3 Client using local environment variables
const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || "";
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
const singleBucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

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
  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });

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

// 2. Initialize database client
const prisma = new PrismaClient();

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error("Error: Missing SUPABASE_SERVICE_ROLE_KEY in environment.");
    process.exit(1);
  }

  console.log("[Migration] Querying local Supabase storage catalog...");
  
  // Retrieve every file record from Supabase storage directly using Raw SQL
  const objects = await prisma.$queryRawUnsafe(
    `SELECT name, bucket_id FROM storage.objects`
  );

  if (!objects || objects.length === 0) {
    console.log("No files found in local Supabase storage.");
    return;
  }

  console.log(`[Migration] Found ${objects.length} files. Starting R2 transfers...`);
  let successCount = 0;
  let skippedCount = 0;
  let failureCount = 0;

  for (const clip of objects) {
    const cleanPath = clip.name;
    const bucket = clip.bucket_id;

    try {
      // 1. Check if the file already exists in Cloudflare R2
      const existingMetadata = await getR2ObjectMetadata(bucket, cleanPath);
      
      if (existingMetadata) {
        console.log(
          `[Migration] Skipped: ${bucket}/${cleanPath} already exists in R2 (Size: ${existingMetadata.ContentLength} bytes).`
        );
        skippedCount++;
        continue;
      }

      console.log(`[Migration] Transferring: ${bucket}/${cleanPath}...`);

      // 2. Fetch file directly from local offline Supabase instance
      const localUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${cleanPath}`;
      const response = await fetch(localUrl, {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      });

      if (!response.ok) {
        console.error(`[Migration] Failed to download ${bucket}/${cleanPath}: ${response.statusText}`);
        failureCount++;
        continue;
      }

      // 3. Extract binary payload and content headers
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") || "application/octet-stream";

      // 4. Dispatch straight up to Cloudflare R2
      await uploadToR2(bucket, cleanPath, buffer, contentType);
      console.log(`[Migration] Successfully migrated ${bucket}/${cleanPath} to R2.`);
      successCount++;
    } catch (err) {
      console.error(`[Migration] Failed to migrate ${bucket}/${cleanPath}:`, err.message || err);
      failureCount++;
    }
  }

  console.log("\n[Migration] Finished!");
  console.log(`- Total files found: ${objects.length}`);
  console.log(`- Successful migrations: ${successCount}`);
  console.log(`- Skipped (already existed): ${skippedCount}`);
  console.log(`- Failed migrations: ${failureCount}`);
}

main()
  .catch((e) => {
    console.error("Critical migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });