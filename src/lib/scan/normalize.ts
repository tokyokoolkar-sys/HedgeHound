import type { ScanMeta, ScanResult, ScanRow, ScanStatus } from "./types.ts"
import { SCANNER_POLL_SECONDS } from "./types.ts"

const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

function strings(v: unknown): string[] | undefined {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : undefined
}

function normalizeRow(raw: unknown): ScanRow | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  // A row without its core figures is not a measurement; drop it rather than guess.
  if (typeof r.symbol !== "string" || !num(r.net_apr) || !num(r.gross_apr) || !num(r.persistence)) {
    return null
  }
  const status: ScanStatus = r.status === "ok" ? "ok" : "building history"
  return {
    symbol: r.symbol,
    gross_apr: r.gross_apr,
    net_apr: r.net_apr,
    persistence: r.persistence,
    samples: num(r.samples) ? r.samples : 0,
    long: typeof r.long === "string" ? r.long : "",
    short: typeof r.short === "string" ? r.short : "",
    liq_dist: num(r.liq_dist) ? r.liq_dist : 0,
    stale: r.stale === true,
    avg_spread_hr: num(r.avg_spread_hr) ? r.avg_spread_hr : null,
    avg_apr_signed: num(r.avg_apr_signed) ? r.avg_apr_signed : null,
    hours_since_flip: num(r.hours_since_flip) ? r.hours_since_flip : 0,
    window_h: num(r.window_h) ? r.window_h : 0,
    n24: num(r.n24) ? r.n24 : 0,
    status,
  }
}

function normalizeMeta(raw: unknown): ScanMeta {
  if (!raw || typeof raw !== "object") return {}
  const m = raw as Record<string, unknown>
  return {
    divisor: num(m.divisor) ? m.divisor : undefined,
    assumed8: strings(m.assumed8),
    skipped_zero: strings(m.skipped_zero),
    skipped_young: strings(m.skipped_young),
    skipped_thin: strings(m.skipped_thin),
    min_vol24_usd: num(m.min_vol24_usd) ? m.min_vol24_usd : undefined,
    min_oi_usd: num(m.min_oi_usd) ? m.min_oi_usd : undefined,
  }
}

/**
 * Turn a parsed `/api/scan` body into a `ScanResult`, or null if it is not one.
 *
 * `ts` arrives in epoch SECONDS and leaves in milliseconds. `live` requires no scanner
 * error AND a completed poll (`ts > 0`); before the first poll the rows are leftovers
 * from an earlier run, so they are not labelled LIVE.
 */
export function normalizeScan(body: unknown): ScanResult | null {
  if (!body || typeof body !== "object") return null
  const b = body as Record<string, unknown>
  if (!Array.isArray(b.rows)) return null
  const rows = b.rows.map(normalizeRow).filter((r): r is ScanRow => r !== null)
  const err = typeof b.err === "string" && b.err.length > 0 ? b.err : null
  const ts = num(b.ts) && b.ts > 0 ? Math.round(b.ts * 1000) : null
  const live = err === null && ts !== null
  return {
    rows,
    meta: normalizeMeta(b.meta),
    live,
    ts,
    err: err ?? (ts === null ? "scanner has not finished its first poll" : null),
  }
}

/**
 * Whole seconds until the scanner's next 300 s poll, from the last poll time (ms).
 * Never negative: when the poll is overdue it reads 0 (due) rather than lying with a
 * wrapped-around countdown.
 */
export function secondsToNextPoll(
  lastPollMs: number,
  nowMs: number,
  pollSeconds: number = SCANNER_POLL_SECONDS,
): number {
  const elapsed = (nowMs - lastPollMs) / 1000
  if (elapsed < 0) return pollSeconds
  return Math.max(0, Math.ceil(pollSeconds - elapsed))
}
