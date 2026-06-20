// ./app/api/media/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateEdgeUrl } from "@/lib/media-signing";

/**
 * DEPRECATED PROXY ENDPOINT
 * Safely redirects legacy requests and cached components natively to the new Edge Worker URL.
 */
export async function GET(req: NextRequest) {
  try {
    const fullPath = req.nextUrl.pathname;
    const parts = fullPath.replace("/api/media/", "").split("/");
    if (parts.length < 2) {
      return new NextResponse("Invalid path parameters.", { status: 400 });
    }

    const bucket = parts[0];
    const storagePath = parts.slice(1).join("/");

    // Map immediately to the new Cloudflare Edge URL, offloading any server stress
    const edgeUrl = generateEdgeUrl(bucket, storagePath, 3600);
    
    return NextResponse.redirect(edgeUrl, { status: 301 });
  } catch (err) {
    return new NextResponse("Internal Server Error.", { status: 500 });
  }
}