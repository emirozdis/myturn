import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/providers";
import { OrientationManager } from "@/components/orientation-manager";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { LandscapeBlocker } from "@/components/shared/landscape-blocker";

const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#080808",
};

export const metadata: Metadata = {
  title: "MyTurn",
  description: "Never miss your turn to vlog with your group.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyTurn",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${satoshi.variable} ${satoshi.className} h-full overflow-hidden antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="h-full w-full overflow-hidden flex flex-col bg-black">
        <LanguageProvider>
          <OrientationManager />

          <div className="portrait-app h-full w-full flex flex-col overflow-hidden">
            <AuthProvider>{children}</AuthProvider>
          </div>

          <LandscapeBlocker />
        </LanguageProvider>
      </body>
    </html>
  );
}