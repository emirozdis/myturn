// ./lib/r2.ts
import { 
  S3Client, 
  GetObjectCommand, 
  PutObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectsCommand 
} from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || "";
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
const singleBucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

function getBucketAndKey(bucketParam: string, keyParam: string) {
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

export const r2 = {
  async upload(bucketParam: string, keyParam: string, body: Buffer, contentType?: string): Promise<void> {
    const { bucket, key } = getBucketAndKey(bucketParam, keyParam);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType || "application/octet-stream",
    });
    await r2Client.send(command);
  },

  async download(bucketParam: string, keyParam: string): Promise<Buffer> {
    const { bucket, key } = getBucketAndKey(bucketParam, keyParam);
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await r2Client.send(command);
    if (!response.Body) {
      throw new Error("No body data payload received from R2 storage endpoint.");
    }
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  },

  async listObjects(bucketParam: string, prefixParam: string): Promise<string[]> {
    const { bucket, key: prefix } = getBucketAndKey(bucketParam, prefixParam);
    let isTruncated = true;
    let token: string | undefined;
    const keys: string[] = [];

    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      });
      const res = await r2Client.send(command);
      if (res.Contents) {
        res.Contents.forEach((c) => {
          if (c.Key) {
            // Strip bucket prefix logically if combined
            if (singleBucketName) {
              if (c.Key.startsWith(`${bucketParam}/`)) {
                keys.push(c.Key.substring(bucketParam.length + 1));
              } else {
                keys.push(c.Key);
              }
            } else {
              keys.push(c.Key);
            }
          }
        });
      }
      isTruncated = res.IsTruncated ?? false;
      token = res.NextContinuationToken;
    }
    return keys;
  },

  async deleteObjects(bucketParam: string, keysParam: string[]): Promise<void> {
    if (keysParam.length === 0) return;
    
    // Deduplicate and filter out empty strings
    const uniqueKeys = Array.from(new Set(keysParam.filter((k) => k)));
    const objectsToDelete = uniqueKeys.map((k) => ({ Key: getBucketAndKey(bucketParam, k).key }));

    // Execute in standardized AWS chunk limits
    for (let i = 0; i < objectsToDelete.length; i += 1000) {
      const batch = objectsToDelete.slice(i, i + 1000);
      const command = new DeleteObjectsCommand({
        Bucket: getBucketAndKey(bucketParam, "").bucket,
        Delete: { Objects: batch },
      });
      await r2Client.send(command);
    }
  }
};