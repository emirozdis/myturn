// ./app/api/media/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { verifySignedMediaUrl } from "@/lib/media-signing";

export async function GET(req: NextRequest) {
  try {
    // Determine dynamic bucket and path using the raw URL rather than params wrapper
    const fullPath = req.nextUrl.pathname;
    const parts = fullPath.replace("/api/media/", "").split("/");
    if (parts.length < 2) {
      return new NextResponse("Invalid path parameters.", { status: 400 });
    }

    const bucket = parts[0];
    const storagePath = parts.slice(1).join("/");

    const { searchParams } = new URL(req.url);
    const expires = searchParams.get("expires");
    const sig = searchParams.get("sig");

    // 1. Authorize: Check for valid cryptographic signature OR valid active user session
    let authorized = false;

    if (expires && sig) {
      const expiresAt = parseInt(expires, 10);
      if (!isNaN(expiresAt)) {
        authorized = verifySignedMediaUrl(bucket, storagePath, expiresAt, sig);
      }
    }

    if (!authorized) {
      const session = await getAuthSession();
      if (session?.user?.id) {
        authorized = true;
      }
    }

    if (!authorized) {
      return new NextResponse("Unauthorized to access this media asset.", { status: 401 });
    }

    // 2. Generate a highly secure, temporary 60-second signed URL directly from Supabase Storage
    const { data: signedData, error: signedError } = await supabaseServer.storage
      .from(bucket)
      .createSignedUrl(storagePath, 60);

    if (signedError || !signedData?.signedUrl) {
      console.error("[Media API] Signed URL generation error:", signedError);
      return new NextResponse("Media asset not found.", { status: 404 });
    }

    // 3. Prepare headers to forward from the client's original HTTP request (mainly Range headers)
    const range = req.headers.get("range");
    const forwardHeaders = new Headers();
    if (range) {
      forwardHeaders.set("Range", range);
    }

    // 4. Fetch the object directly from the private Supabase endpoint with streaming capability
    const storageRes = await fetch(signedData.signedUrl, {
      headers: forwardHeaders,
    });

    if (!storageRes.ok) {
      console.error(`[Media API] Direct storage fetch failed with status ${storageRes.status}`);
      return new NextResponse("Error retrieving media asset.", { status: storageRes.status });
    }

    // 5. Build response headers to stream back to the client
    const responseHeaders = new Headers();
    
    const keys = ["Content-Type", "Content-Range", "Accept-Ranges", "Content-Length"];
    keys.forEach((k) => {
      const v = storageRes.headers.get(k);
      if (v) responseHeaders.set(k, v);
    });
    
    // Maximize CDN / Client cache capabilities for chunks and static reads
    responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

    // 6. Return response body as a standard ReadableStream (O(1) Memory Footprint, Zero RAM Bottleneck)
    return new NextResponse(storageRes.body, {
      status: storageRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("[Media API] Critical error processing request:", err);
    return new NextResponse("Internal Server Error.", { status: 500 });
  }
}