import type { ScanParams, ScanResult } from "./types.ts"
import { SCANNER_POLL_SECONDS } from "./types.ts"

/**
 * Pure pieces of the scan query (key, URL, refetch cadence, staleness). No React, no
 * `window`, no `import.meta.env`, so they can be unit-tested under plain node.
 */

/** Poll cadence while the scanner is answering. */
export const SCAN_REFETCH_MS = 30_000
/** A live answer stays fresh this long, so focus/remount do not refetch every time. */
export const SCAN_STALE_MS = 25_000

/**
 * Offline backoff. While the fallback is showing, wait 30 s after the first miss, 2 min
 * after the second and 5 min after every further one. The first live answer resets it.
 */
export const BACKOFF_STEPS_MS = [30_000, 120_000, 300_000] as const

/** A LIVE reading older than this many ms is shown STALE (the scanner polls every 300 s). */
export const STALE_AFTER_MS = SCANNER_POLL_SECONDS * 1000

/** TanStack query key. Every knob that changes the request is in it. */
export function scanKey(p: ScanParams) {
  return ["scan", { min: p.min, hold: p.hold, cost: p.cost, lev: p.lev }] as const
}

/** The query string `/api/scan` takes. `cost` is the round-trip cost in percent. */
export function scanQueryString(p: ScanParams): string {
  return new URLSearchParams({
    min: String(p.min),
    hold: String(p.hold),
    cost: String(p.cost),
    lev: String(p.lev),
  }).toString()
}

/**
 * Milliseconds to wait before the next fetch, given the last answer.
 * `misses` counts consecutive fallback answers (0 after a live one).
 */
export function refetchIntervalMs(last: Pick<ScanResult, "live" | "misses"> | undefined): number {
  if (!last || last.live) return SCAN_REFETCH_MS
  const misses = Math.max(1, last.misses ?? 1)
  return BACKOFF_STEPS_MS[Math.min(misses, BACKOFF_STEPS_MS.length) - 1]
}

/** How long an answer counts as fresh: 25 s while live, the backoff step while offline. */
export function staleTimeMs(last: Pick<ScanResult, "live" | "misses"> | undefined): number {
  return last && !last.live ? refetchIntervalMs(last) : SCAN_STALE_MS
}

/** Consecutive fallback answers after `fresh`, given the answer before it. */
export function nextMisses(prev: Pick<ScanResult, "misses"> | undefined, fresh: Pick<ScanResult, "live">): number {
  return fresh.live ? 0 : (prev?.misses ?? 0) + 1
}

/**
 * LIVE reading older than one scanner poll. Takes the client clock; pass null until
 * mounted, so the server render and the first client render never disagree.
 */
export function isStale(ts: number | null, nowMs: number | null, afterMs: number = STALE_AFTER_MS): boolean {
  return ts !== null && nowMs !== null && nowMs - ts > afterMs
}
