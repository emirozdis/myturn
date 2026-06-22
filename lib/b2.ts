// ./lib/b2.ts
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

// Used exclusively for the automated server-side archival system
const endpoint = process.env.B2_ENDPOINT || "";
const accessKeyId = process.env.B2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.B2_SECRET_ACCESS_KEY || "";
const singleBucketName = process.env.B2_BUCKET_NAME || "";

export const b2Client = new S3Client({
  region: process.env.B2_REGION || "us-east-005",
  endpoint,
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

export const b2 = {
  async upload(bucketParam: string, keyParam: string, body: Buffer, contentType?: string): Promise<void> {
    const { bucket, key } = getBucketAndKey(bucketParam, keyParam);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType || "application/octet-stream",
    });
    await b2Client.send(command);
  },

  async head(bucketParam: string, keyParam: string): Promise<void> {
    const { bucket, key } = getBucketAndKey(bucketParam, keyParam);
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    // This will explicitly throw an error if the object is missing or corrupted
    await b2Client.send(command);
  }
};