// ./proxy.ts
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  // Extract the JWT token safely within the Edge runtime
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  const isAuth = !!token;
  const isRoot = req.nextUrl.pathname === "/";

  // If an authenticated user lands on the root onboarding, immediately bounce them to the app
  if (isRoot && isAuth) {
    return NextResponse.redirect(new URL("/today", req.url));
  }

  // Unauthenticated protection for private routes
  if (!isRoot && !isAuth) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/today/:path*",
    "/record/:path*",
    "/social/:path*",
    "/streaks/:path*",
    "/profile/:path*",
  ],
};