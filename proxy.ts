import { withAuth } from "next-auth/middleware";

export const proxy = withAuth({
  pages: {
    signIn: "/",
    error: "/",
  },
});

export const config = {
  matcher: [
    "/today/:path*",
    "/record/:path*",
    "/social/:path*",
    "/streaks/:path*",
    "/profile/:path*"
  ],
};