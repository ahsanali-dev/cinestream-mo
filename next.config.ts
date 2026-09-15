import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.100.21",
    "192.168.100.*",
    "192.168.*.*",
    "10.*.*.*",
    "*.local",
  ],
};

export default nextConfig;
