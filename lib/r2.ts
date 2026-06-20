// ./lib/r2.ts
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

// Used exclusively for server-side Next.js operations (Uploading from client, or Transcoder downloading raw video)
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
  }
};