import crypto from "crypto";

const SIGNING_SECRET = process.env.NEXTAUTH_SECRET || "default-media-signing-secret";

/**
 * Generates a secure, temporary, and cryptographically signed application-level URL 
 * to retrieve private media assets via the local `/api/media` endpoint.
 */
export function generateSignedMediaUrl(bucket: string, path: string, expiresInSeconds = 3600): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${bucket}:${path}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(payload)
    .digest("hex");
  
  const encodedPath = encodeURIComponent(path);
  return `/api/media?bucket=${bucket}&path=${encodedPath}&expires=${expiresAt}&sig=${signature}`;
}

/**
 * Validates a signed media URL's cryptographic signature and checks for expiration.
 */
export function verifySignedMediaUrl(bucket: string, path: string, expiresAt: number, signature: string): boolean {
  if (Math.floor(Date.now() / 1000) > expiresAt) {
    return false; // Token has expired
  }
  const payload = `${bucket}:${path}:${expiresAt}`;
  const expectedSignature = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(payload)
    .digest("hex");
  
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}