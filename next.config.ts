import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Explicitly point Next.js root to this project folder to avoid parent workspace lockfile inference
  experimental: {
    turbo: {
      root: path.resolve(__dirname),
    },
  },
};

export default nextConfig;

