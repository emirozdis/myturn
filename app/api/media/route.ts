// ./app/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { r2 } from "@/lib/r2";
import { rateLimit } from "@/lib/rate-limit";

// Maximum 50MB file size limit for raw video assets
const MAX_FILE_SIZE = 50 * 1024 * 1024;
// Restrict access to designated buckets to prevent accidental overrides
const ALLOWED_BUCKETS = ["vlogs", "avatars", "thumbnails"];

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized.", { status: 401 });
    }

    // --- Rate Limiting: Max 30 media uploads per minute per user ---
    const rl = rateLimit(`media_upload_${session.user.id}`, 30, 60000);
    if (!rl.success) {
      return new NextResponse(`Rate limit exceeded. Try again in ${rl.retryAfter}s.`, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string | null;
    const path = formData.get("path") as string | null;

    if (!file || !bucket || !path) {
      return new NextResponse("Missing required fields.", { status: 400 });
    }

    // --- Abuse Protection: Size Limit ---
    if (file.size > MAX_FILE_SIZE) {
      return new NextResponse("Payload too large. Maximum file size is 50MB.", { status: 413 });
    }

    // --- Abuse Protection: Bucket Validation ---
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return new NextResponse("Invalid bucket destination.", { status: 400 });
    }

    // --- Abuse Protection: Path Traversal Prevention ---
    if (path.includes("..") || path.startsWith("/")) {
      return new NextResponse("Invalid path definition.", { status: 400 });
    }

    // --- Abuse Protection: MIME Type Validation ---
    if (!file.type.startsWith("video/") && !file.type.startsWith("image/")) {
      return new NextResponse("Invalid file format. Only images and videos are permitted.", { status: 415 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      await r2.upload(bucket, path, buffer, file.type || "application/octet-stream");
    } catch (error: any) {
      console.error("[Media API] Upload error:", error);
      return new NextResponse(`Upload failed: ${error.message || "Unknown R2 error"}`, { status: 500 });
    }

    return NextResponse.json({ success: true, path });
  } catch (err: any) {
    console.error("[Media API] Critical error processing upload:", err);
    return new NextResponse("Internal Server Error.", { status: 500 });
  }
}