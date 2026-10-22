// One coin's recent history from the local scanner (T41: `GET /api/history?sym=&hours=`). LIVE only: there is no
// sample history, so when the scanner is off (or older than T41) the pieces that need it simply don't render.
import type { ScanRow } from "./types.ts"

export type HistoryPoint = {
  /** Epoch ms of the poll. */
  ts: number
  /** Hourly funding on Lighter / Binance at that poll. */
  l: number
  b: number
  /** Signed spread as APR %: positive when Lighter pays more. */
  spreadApr: number
}

/** Parse a `/api/history` body; null when it isn't one. Points come back oldest first, bad ones dropped. */
export function normalizeHistory(body: unknown): HistoryPoint[] | null {
  if (!body || typeof body !== "object") return null
  const pts = (body as { points?: unknown }).points
  if (!Array.isArray(pts)) return null
  const ok = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)
  return pts
    .map((p) => p as Record<string, unknown>)
    .filter((p) => p && ok(p.ts) && ok(p.l) && ok(p.b) && ok(p.spread_apr))
    .map((p) => ({ ts: Math.round((p.ts as number) * 1000), l: p.l as number, b: p.b as number, spreadApr: p.spread_apr as number }))
    .sort((a, b) => a.ts - b.ts)
}

/** A coin's net hourly spread as APR %, as the scanner signs it (long the cheaper venue). */
export const venueSpreadApr = (r: Pick<ScanRow, "lighter_hr" | "binance_hr">) =>
  r.lighter_hr != null && r.binance_hr != null ? (r.lighter_hr - r.binance_hr) * 8760 * 100 : null

/** An hourly rate as APR %, with a true minus. */
export const hourlyApr = (hr: number) => {
  const v = hr * 8760 * 100
  return `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`
}

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? ""

/** Fetch a coin's history; null on any failure (no fallback: history is never sampled). */
export async function fetchHistory(sym: string, hours = 24, signal?: AbortSignal): Promise<HistoryPoint[] | null> {
  try {
    const res = await fetch(`${BASE}/api/history?sym=${encodeURIComponent(sym)}&hours=${hours}`, { signal })
    if (!res.ok) return null
    return normalizeHistory(await res.json())
  } catch {
    return null
  }
}
