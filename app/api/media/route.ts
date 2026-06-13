// ./app/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { verifySignedMediaUrl } from "@/lib/media-signing";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bucket = searchParams.get("bucket");
    const path = searchParams.get("path");
    const expires = searchParams.get("expires");
    const sig = searchParams.get("sig");

    if (!bucket || !path) {
      return new NextResponse("Bucket and path parameters are required.", { status: 400 });
    }

    // 1. Authorize: Check for valid cryptographic signature OR valid active user session
    let authorized = false;

    if (expires && sig) {
      const expiresAt = parseInt(expires, 10);
      if (!isNaN(expiresAt)) {
        authorized = verifySignedMediaUrl(bucket, path, expiresAt, sig);
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

    // 2. Fetch the private file directly from Supabase Storage
    const { data, error } = await supabaseServer.storage.from(bucket).download(path);

    if (error || !data) {
      console.error("[Media API] File download error:", error);
      return new NextResponse("Media asset not found.", { status: 404 });
    }

    // 3. Support Partial Content (Range requests) for seeking within video files
    const range = req.headers.get("range");
    const arrayBuffer = await data.arrayBuffer();
    const totalLength = arrayBuffer.byteLength;

    const headers = new Headers();
    headers.set("Content-Type", data.type || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

      if (start >= totalLength || end >= totalLength) {
        headers.set("Content-Range", `bytes */${totalLength}`);
        return new NextResponse("Requested Range Not Satisfiable", {
          status: 416,
          headers,
        });
      }

      const chunk = arrayBuffer.slice(start, end + 1);
      headers.set("Content-Range", `bytes ${start}-${end}/${totalLength}`);
      headers.set("Accept-Ranges", "bytes");
      headers.set("Content-Length", String(chunk.byteLength));

      return new NextResponse(chunk, {
        status: 206,
        headers,
      });
    }

    headers.set("Content-Length", String(totalLength));
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error("[Media API] Critical error processing request:", err);
    return new NextResponse("Internal Server Error.", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized.", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string | null;
    const path = formData.get("path") as string | null;

    if (!file || !bucket || !path) {
      return new NextResponse("Missing required fields.", { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabaseServer.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (error) {
      console.error("[Media API] Upload error:", error);
      return new NextResponse(`Upload failed: ${error.message}`, { status: 500 });
    }

    return NextResponse.json({ success: true, path });
  } catch (err: any) {
    console.error("[Media API] Critical error processing upload:", err);
    return new NextResponse("Internal Server Error.", { status: 500 });
  }
}