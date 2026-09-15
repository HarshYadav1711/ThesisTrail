import type { NextConfig } from "next";

/**
 * Vercel serverless output-file tracing does not always include the fixed CSV
 * referenced via path constants. Without this include, production
 * POST /api/research/run fails dataset integrity checks even though the file
 * is in the repository.
 */
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/research/run": ["./data/nifty50/nifty50-ohlc-2007-2025.csv"],
  },
};

export default nextConfig;
