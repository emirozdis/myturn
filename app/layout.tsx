import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/providers";
import { OrientationManager } from "@/components/orientation-manager";

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
      lang="en"
      className={`${satoshi.variable} ${satoshi.className} h-screen overflow-hidden antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="h-screen w-full overflow-hidden flex flex-col bg-black">
        <OrientationManager />
        
        <div className="portrait-app h-full w-full flex flex-col overflow-hidden">
          <AuthProvider>{children}</AuthProvider>
        </div>
        
        {/* Landscape Fallback Blocker for Mobile Web context */}
        <div className="landscape-blocker hidden fixed inset-0 z-[9999] bg-[#0a0a0a] items-center justify-center text-center p-8 flex-col">
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e07c30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <h2 className="text-white text-2xl font-bold mb-2 tracking-tight">Rotate your device</h2>
          <p className="text-white/50 text-[15px] max-w-[280px]">
            MyTurn is optimized for portrait mode. Please rotate your phone back to portrait to continue.
          </p>
        </div>
      </body>
    </html>
  );
}