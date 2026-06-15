import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["192.168.0.49", "8f4c-78-167-0-206.ngrok-free.app","adfa-78-167-4-110.ngrok-free.app", "f415-78-167-4-110.ngrok-free.app"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "n3dwc3pf-3000.euw.devtunnels.ms",
        "8f4c-78-167-0-206.ngrok-free.app",
        "192.168.0.49",
        "adfa-78-167-4-110.ngrok-free.app"
      ]
    }
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;