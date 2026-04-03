import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["yahoo-finance2"],
  allowedDevOrigins: ["192.168.1.71"],
};

export default nextConfig;
