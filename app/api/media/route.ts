// ./app/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

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