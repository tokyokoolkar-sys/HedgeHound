// The loudest reading: the clean scent (status ok) with the highest net APR, or, if nothing is clean
// yet, the highest net APR still building history. Shared by the β reading (T15) and the α→β carousel
// (T14), so the featured coin and the carousel's exclusion always agree.
import type { ScanRow } from "./types.ts"

export type Loudest = { symbol: string; net: number; ok: boolean }

export function pickLoudest(rows: ScanRow[]): Loudest | null {
  if (rows.length === 0) return null
  const byNet = (a: ScanRow, b: ScanRow) => b.net_apr - a.net_apr
  const top = rows.filter((r) => r.status === "ok").sort(byNet)[0] ?? [...rows].sort(byNet)[0]
  return { symbol: top.symbol, net: top.net_apr, ok: top.status === "ok" }
}

/** Carousel entries: every coin except the featured one, in groups of `group` (incomplete tail dropped). */
export function carouselRows(rows: ScanRow[], exclude: string | null, max = 30, group = 5) {
  const list = rows
    .filter((r) => r.symbol !== exclude)
    .slice(0, max)
    // Orange means clean and paying, the same rule as the radar, the search and the scanner (P4 close).
    .map((r) => ({ symbol: r.symbol, net: r.net_apr, alert: r.status === "ok" && r.net_apr > 0 }))
  return list.slice(0, list.length - (list.length % group))
}

/** Net APR for display: one decimal, a true minus (−) for negatives, no plus sign. */
export const formatNet = (net: number) => `${net < 0 ? "−" : ""}${Math.abs(net).toFixed(1)}%`
