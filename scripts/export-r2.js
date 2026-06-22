// ./scripts/backup-r2.js

try {
  // Load environment variables from .env and .env.local
  require("dotenv").config({ path: ".env.local" });
  require("dotenv").config();
} catch (e) {
  console.log("[Backup Warning] dotenv module not found. Relying on system environment variables.");
}

const { S3Client, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream/promises");

// 1. Validate Environment Credentials
const accountId = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || "").trim();
const accessKeyId = (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "").trim();
const secretAccessKey = (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "").trim();
const envBucketName = (process.env.CLOUDFLARE_R2_BUCKET_NAME || "").trim();

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error("\n❌ Error: Missing Cloudflare R2 credentials in environment variables.");
  console.error("Please ensure the following are defined in your .env or .env.local file:");
  console.error("  - CLOUDFLARE_R2_ACCOUNT_ID");
  console.error("  - CLOUDFLARE_R2_ACCESS_KEY_ID");
  console.error("  - CLOUDFLARE_R2_SECRET_ACCESS_KEY\n");
  process.exit(1);
}

// 2. Resolve Target Bucket Name
// Command Line Args: node scripts/backup-r2.js [optional_bucket_override]
const targetBucket = "myturn-prod";
const concurrencyLimit = 20; // Download 5 files simultaneously to prevent file descriptor starvation

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Promise Pool to manage concurrent download tasks
 */
async function runWithConcurrency(tasks, limit) {
  const executing = new Set();
  const results = [];

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
 * Formats byte values for readability
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Sums the size of listed objects
 */
function sumBytes(arr) {
  return arr.reduce((acc, obj) => acc + obj.size, 0);
}

async function main() {
  console.log("=========================================");
  console.log("       CLOUDFLARE R2 BACKUP UTILITY      ");
  console.log("=========================================\n");
  console.log(`[Backup] Target Bucket: "${targetBucket}"`);
  console.log("[Backup] Querying R2 directory catalog... This may take a moment.");

  let objects = [];
  let isTruncated = true;
  let nextContinuationToken = undefined;

  // 1. Paginate and gather all files
  try {
    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: targetBucket,
        ContinuationToken: nextContinuationToken,
      });

      const data = await s3Client.send(command);
      if (data.Contents) {
        for (const item of data.Contents) {
          objects.push({
            key: item.Key,
            size: item.Size,
          });
        }
      }

      isTruncated = data.IsTruncated;
      nextContinuationToken = data.NextContinuationToken;
    }
  } catch (err) {
    console.error(`\n❌ S3 List Error: Failed to retrieve object list from bucket "${targetBucket}".`);
    console.error(`Details: ${err.message || err}`);
    process.exit(1);
  }

  if (objects.length === 0) {
    console.log(`\n[Backup] Bucket "${targetBucket}" contains no files. Nothing to backup!`);
    return;
  }

  const totalPayloadSize = sumBytes(objects);
  console.log(`\n[Backup] Found ${objects.length} files to download.`);
  console.log(`[Backup] Total payload volume: ${formatBytes(totalPayloadSize)}`);

  const backupDir = path.join(process.cwd(), "backup", targetBucket);
  console.log(`[Backup] Target Local Directory: ${backupDir}\n`);

  // Ensure local base directory exists
  fs.mkdirSync(backupDir, { recursive: true });

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  // 2. Build download tasks
  const downloadTasks = objects.map((obj, index) => {
    return async () => {
      const localFilePath = path.join(backupDir, obj.key);
      const localFileDir = path.dirname(localFilePath);

      // Check if file already exists locally with matching size (avoids redownloads if retrying)
      if (fs.existsSync(localFilePath)) {
        const stats = fs.statSync(localFilePath);
        if (stats.size === obj.size) {
          console.log(`  [-] [${index + 1}/${objects.length}] SKIPPED: ${obj.key} (Already Backed Up)`);
          skipCount++;
          return;
        }
      }

      try {
        // Ensure nesting folder structure exists locally
        fs.mkdirSync(localFileDir, { recursive: true });

        console.log(`  [+] [${index + 1}/${objects.length}] DOWNLOADING: ${obj.key} (${formatBytes(obj.size)})`);

        const getObjectRes = await s3Client.send(new GetObjectCommand({
          Bucket: targetBucket,
          Key: obj.key,
        }));

        if (!getObjectRes.Body) {
          throw new Error("Empty body payload returned from R2 stream.");
        }

        const writeStream = fs.createWriteStream(localFilePath);
        
        // Node.js standard stream pipeline avoids loading massive files into RAM
        await pipeline(getObjectRes.Body, writeStream);

        successCount++;
      } catch (err) {
        console.error(`  [x] [${index + 1}/${objects.length}] FAILED: ${obj.key} - Error: ${err.message || err}`);
        failCount++;
      }
    };
  });

  // 3. Process downloads within the Concurrency Pool
  await runWithConcurrency(downloadTasks, concurrencyLimit);

  console.log("\n=========================================");
  console.log("             BACKUP COMPLETE             ");
  console.log("=========================================");
  console.log(`  - Total Files Listed:    ${objects.length}`);
  console.log(`  - Successfully Downloaded: ${successCount}`);
  console.log(`  - Skipped (Up to date):   ${skipCount}`);
  console.log(`  - Failed Downloads:       ${failCount}`);
  console.log(`  - Local Directory:       ${backupDir}`);
  console.log("=========================================\n");
}

main().catch((err) => {
  console.error("Critical Backup Error:", err);
  process.exit(1);
});