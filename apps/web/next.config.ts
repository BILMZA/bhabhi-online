import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.18.210", // replace with your PC's LAN IP
  ],
};

export default nextConfig;