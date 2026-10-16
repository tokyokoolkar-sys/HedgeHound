import type { NextConfig } from "next"

/** The local scanner (WhaleHunterAlt `server.py`). Deploys point this at wherever the scanner runs. */
const SCANNER_URL = process.env.SCANNER_URL ?? "http://127.0.0.1:8000"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${SCANNER_URL}/api/:path*` }]
  },
  async redirects() {
    // The old Grok-built universe view is gone (T33): /universe lands on /sky; the query (?star=) carries over.
    return [{ source: "/universe", destination: "/sky", permanent: false }]
  },
}

export default nextConfig
