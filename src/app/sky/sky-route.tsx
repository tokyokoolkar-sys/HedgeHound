"use client"
import { SkyPage } from "@/components/sky/sky-page"
import { useQuery } from "@/lib/nav"

/** `star`: the coin in focus. */
export type SkySearch = { star?: string }

export function parseSkySearch(search: Record<string, unknown>): SkySearch {
  return {
    star: typeof search.star === "string" && /^[A-Za-z0-9._-]{1,24}$/.test(search.star) ? search.star.toUpperCase() : undefined,
  }
}

export function SkyRoute() {
  const { star } = parseSkySearch(useQuery())
  return <SkyPage star={star} />
}
