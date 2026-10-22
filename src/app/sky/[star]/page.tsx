import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { parseStar, skyPath, skyTitle } from "@/lib/sky-path"

type Props = { params: Promise<{ star: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: { absolute: skyTitle(parseStar((await params).star)) } }
}

/**
 * /sky/<STAR>: rendered on demand (any coin the scanner lists; nothing is fetched here, so it stays cheap).
 * The layout renders the sky; this page only keeps the address canonical: `btc` → `BTC`, a bad symbol → /sky.
 */
export default async function Page({ params }: Props) {
  const raw = (await params).star
  const star = parseStar(raw)
  if (star !== raw) redirect(skyPath(star))
  return null
}
