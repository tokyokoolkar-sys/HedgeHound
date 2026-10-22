import type { NextConfig } from "next"

/** The local scanner (WhaleHunterAlt `server.py`). Deploys point this at wherever the scanner runs. */
const SCANNER_URL = process.env.SCANNER_URL ?? "http://127.0.0.1:8000"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Old /sky?star= and /universe addresses are redirected by src/proxy.ts (it needs the query).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${SCANNER_URL}/api/:path*` }]
  },
}

export default nextConfig
