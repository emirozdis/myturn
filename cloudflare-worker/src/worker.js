// cloudflare-worker/src/worker.js

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
    
    const bucket = env.MY_BUCKET;
    const allowedOrigin = env.ALLOWED_ORIGIN;

    // 1. CORS Preflight Handling
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin || "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Range",
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

    // 3. Signature & Expiry Verification
    const payload = await verifyToken(tokenToVerify, env.MEDIA_SECRET_KEY);
    if (!payload) {
      return new Response("Forbidden - Invalid or Expired Token", { status: 403 });
    }

    // 4. Path Scope Validation
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    if (!cleanPath.startsWith(payload.p)) {
      return new Response("Forbidden - Path Mismatch", { status: 403 });
    }

    if (!bucket) {
      return new Response("Internal Server Error - R2 Bucket Not Configured", { status: 500 });
    }

    // 5. HTTP Range Request Support (Essential for Safari video buffering)
    const rangeHeader = request.headers.get("Range");
    let object;
    try {
      if (rangeHeader) {
        object = await bucket.get(cleanPath, {
          range: request.headers,
          onlyIf: request.headers,
        });
      } else {
        object = await bucket.get(cleanPath, {
          onlyIf: request.headers,
        });
      }
    } catch (e) {
      return new Response("Internal Server Error", { status: 500 });
    }

    if (object === null) {
      return new Response("Not Modified", { status: 304 });
    }
    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    // 6. Build Baseline Response Headers
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", allowedOrigin || "*");
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Accept-Ranges", "bytes");

    let status = 200;

    if (rangeHeader && object.range) {
      status = 206;
      headers.set("Content-Range", `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
      headers.set("Content-Length", object.range.length.toString());
    } else {
      headers.set("Content-Length", object.size.toString());
    }

    // 7. Inject Scoped Fallback Cookie
    if (queryToken) {
      const cookiePath = payload.p.startsWith("/") ? payload.p : `/${payload.p}`;
      headers.append(
        "Set-Cookie", 
        `media_session=${queryToken}; Path=${cookiePath}; HttpOnly; Secure; SameSite=None; Max-Age=3600`
      );
    }
    
    // Explicit Content-Type mappings
    const ext = cleanPath.split('.').pop().toLowerCase();
    const contentTypeMap = {
      "m3u8": "application/vnd.apple.mpegurl",
      "ts": "video/MP2T",
      "mp4": "video/mp4",
      "webm": "video/webm",
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "png": "image/png"
    };

    if (contentTypeMap[ext]) {
      headers.set("Content-Type", contentTypeMap[ext]);
    }

    // 8. Dynamic Playlist Rewriting
    // If requesting HLS (.m3u8) files, we rewrite them on the fly to append the verified 
    // query token to all relative chunk and playlist paths.
    if (cleanPath.endsWith(".m3u8")) {
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      
      if (tokenToVerify) {
        const text = await object.text();
        const lines = text.split("\n");
        const rewrittenLines = lines.map((line) => {
          const trimmed = line.trim();
          // Rewrite URIs (lines not starting with '#' and not empty)
          if (trimmed && !trimmed.startsWith("#")) {
            const separator = trimmed.includes("?") ? "&" : "?";
            return `${trimmed}${separator}token=${encodeURIComponent(tokenToVerify)}`;
          }
          return line;
        });
        
        const rewrittenText = rewrittenLines.join("\n");
        const encodedText = new TextEncoder().encode(rewrittenText);
        
        headers.set("Content-Length", encodedText.length.toString());
        return new Response(encodedText, { status, headers });
      }
    } else {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    return new Response(object.body, { status, headers });
  }
};