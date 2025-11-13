import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Empty turbopack config to silence the warning
  // We do OCR client-side so no special config needed
  turbopack: {},
};

export default nextConfig;
