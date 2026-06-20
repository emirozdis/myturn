// ./lib/media-signing.ts
import crypto from "crypto";

const SIGNING_SECRET = process.env.NEXTAUTH_SECRET || "default-media-signing-secret";
const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL || "https://media.myturn.app";

function base64url(str: string | Buffer) {
  if (typeof str === "string") {
    return Buffer.from(str).toString("base64url");
  }
  return str.toString("base64url");
}

/**
 * Mints an Edge Authorization Token and appends it to the Cloudflare Worker domain.
 * If the path belongs to a playlist (.m3u8), it authorizes the entire parent directory
 * to ensure all relative segment chunk requests are validated automatically via the cookie.
 */
export function generateEdgeUrl(bucket: string, path: string, expiresInSeconds = 3600): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  const fullPath = `${bucket}/${cleanPath}`;
  
  const isHls = fullPath.includes(".m3u8");
  
  // Authorize directory prefix for HLS, or exact file path for standalone assets
  const authPath = isHls ? fullPath.substring(0, fullPath.lastIndexOf("/") + 1) : fullPath;

  const payload = JSON.stringify({ p: authPath, e: expiresAt });
  const encodedPayload = base64url(payload);
  
  const signature = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(encodedPayload)
    .digest("base64url");
    
  const token = `${encodedPayload}.${signature}`;
  
  return `${MEDIA_URL}/${fullPath}?token=${token}`;
}