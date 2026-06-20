// index.js (or worker.js)

function decodeBase64Url(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const raw = atob(base64);
  const result = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    result[i] = raw.charCodeAt(i);
  }
  return result;
}

async function verifyToken(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  
  const [encodedPayload, signature] = parts;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify", "sign"]
  );
  
  const expectedSigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));
  const expectedSigStr = btoa(String.fromCharCode(...new Uint8Array(expectedSigBuffer)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    
  if (signature !== expectedSigStr) return null;
  
  try {
    const payloadStr = new TextDecoder().decode(decodeBase64Url(encodedPayload));
    const payload = JSON.parse(payloadStr);
    
    if (payload.e < Math.floor(Date.now() / 1000)) return null;
    
    return payload;
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Loaded dynamically via the local dashboard bindings
    const bucket = env.MY_BUCKET;
    const allowedOrigin = env.ALLOWED_ORIGIN;

    // 1. CORS Preflight Handling
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin || "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // 2. Token Extraction
    const queryToken = url.searchParams.get("token");
    const cookies = request.headers.get("Cookie") || "";
    const cookieMatch = cookies.match(/(?:^|;) *media_session=([^;]*)/);
    const cookieToken = cookieMatch ? cookieMatch[1] : null;

    const tokenToVerify = queryToken || cookieToken;

    if (!tokenToVerify) {
      return new Response("Unauthorized - Missing Token", { status: 401 });
    }

    // 3. Signature & Expiry Validation
    const payload = await verifyToken(tokenToVerify, env.MEDIA_SECRET_KEY);
    if (!payload) {
      return new Response("Forbidden - Invalid or Expired Token", { status: 403 });
    }

    // 4. Path Scope Validation
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    if (!cleanPath.startsWith(payload.p)) {
      return new Response("Forbidden - Path Mismatch", { status: 403 });
    }

    // 5. Fetch directly from the R2 Binding
    if (!bucket) {
      return new Response("Internal Server Error - R2 Bucket Not Configured", { status: 500 });
    }
    const object = await bucket.get(cleanPath);

    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    // 6. Build Headers
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", allowedOrigin || "*");
    headers.set("Access-Control-Allow-Credentials", "true");

    // 7. Inject HttpOnly Signed Cookie if requested via Query Param
    if (queryToken) {
      headers.append(
        "Set-Cookie", 
        `media_session=${queryToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=3600`
      );
    }
    
    // 8. Dynamic Edge Caching
    if (cleanPath.endsWith(".m3u8")) {
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      headers.set("Content-Type", "application/vnd.apple.mpegurl");
    } else if (cleanPath.endsWith(".ts")) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Content-Type", "video/MP2T");
    } else {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    return new Response(object.body, { headers });
  }
};