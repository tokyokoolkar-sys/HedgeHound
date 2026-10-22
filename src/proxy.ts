import { NextResponse, type NextRequest } from "next/server"
import { parseStar, skyPath } from "@/lib/sky-path"

/**
 * Old sky addresses land on the dynamic route: /sky?star=btc and /universe?star=btc → /sky/BTC,
 * /universe → /sky (the old Grok-built universe view is gone, T33). Other query keys carry over.
 */
export function proxy(req: NextRequest) {
  const url = req.nextUrl
  const raw = url.searchParams.get("star")
  if (url.pathname === "/sky" && raw === null) return NextResponse.next()
  const to = url.clone()
  to.pathname = skyPath(parseStar(raw))
  to.searchParams.delete("star")
  return NextResponse.redirect(to)
}

export const config = { matcher: ["/sky", "/universe"] }
