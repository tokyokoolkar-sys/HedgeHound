"use client"
import { SkyPage } from "@/components/sky/sky-page"
import { usePath } from "@/lib/nav"
import { skyTitle, starFromPath } from "@/lib/sky-path"
import { useEffect } from "react"

/**
 * The star comes from the pathname, not route params: a focus change rewrites the address in place
 * (History API), which Next syncs into usePathname without a server round trip. That skips Next's metadata,
 * so the title follows the star here.
 */
export function SkyRoute() {
  const star = starFromPath(usePath())
  useEffect(() => {
    document.title = skyTitle(star)
  }, [star])
  return <SkyPage star={star} />
}
