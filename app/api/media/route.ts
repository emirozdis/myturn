// ./app/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { r2 } from "@/lib/r2";

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