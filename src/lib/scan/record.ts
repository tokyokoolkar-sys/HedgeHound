import type { ScanParams, ScanResult } from "./types.ts"
import { DEFAULT_SCAN_PARAMS } from "./types.ts"
import { normalizeScan } from "./normalize.ts"
import { scanQueryString } from "./query.ts"

export type ScanCoinRecord = {
  symbol: string
  grossApr: number
  netApr: number
  persistence: number
  samples: number
  long: string
  short: string
  liqDist: number
  stale: boolean
  avgSpreadHr: number | null
  avgAprSigned: number | null
  hoursSinceFlip: number
  windowH: number
  n24: number
  status: "ok" | "building_history"
  lighterHr: number | null
  binanceHr: number | null
  lighterVol24Usd: number | null
  lighterOiUsd: number | null
  binanceVol24Usd: number | null
  binanceOiUsd: number | null
}

export type ScanRecord = {
  scannerTs: Date
  minApr: number
  holdHours: number
  costPct: number
  leverage: number
  meta: unknown
  coins: ScanCoinRecord[]
}

export function toScanRecord(scan: ScanResult, params: ScanParams): ScanRecord | null {
  if (!scan.live || scan.ts === null) return null
  return {
    scannerTs: new Date(scan.ts),
    minApr: params.min,
    holdHours: params.hold,
    costPct: params.cost,
    leverage: params.lev,
    meta: scan.meta,
    coins: scan.rows.map((r) => ({
      symbol: r.symbol,
      grossApr: r.gross_apr,
      netApr: r.net_apr,
      persistence: r.persistence,
      samples: r.samples,
      long: r.long,
      short: r.short,
      liqDist: r.liq_dist,
      stale: r.stale,
      avgSpreadHr: r.avg_spread_hr,
      avgAprSigned: r.avg_apr_signed,
      hoursSinceFlip: r.hours_since_flip,
      windowH: r.window_h,
      n24: r.n24,
      status: r.status === "ok" ? "ok" : "building_history",
      lighterHr: r.lighter_hr,
      binanceHr: r.binance_hr,
      lighterVol24Usd: r.lighter_vol24_usd,
      lighterOiUsd: r.lighter_oi_usd,
      binanceVol24Usd: r.binance_vol24_usd,
      binanceOiUsd: r.binance_oi_usd,
    })),
  }
}

export type PollDeps = {
  fetchJson: (url: string, init?: { signal?: AbortSignal }) => Promise<unknown>
  save: (record: ScanRecord) => Promise<void> | void
  params?: ScanParams
  baseUrl?: string
}

export async function pollAndRecord(deps: PollDeps): Promise<void> {
  const params = deps.params ?? { ...DEFAULT_SCAN_PARAMS, min: 0 }
  const base = deps.baseUrl ?? process.env.SCANNER_URL ?? "http://127.0.0.1:8000"
  const qs = scanQueryString(params)
  const url = `${base}/api/scan?${qs}`
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 10_000)
    let body: unknown
    try {
      body = await deps.fetchJson(url, { signal: controller.signal })
    } finally {
      clearTimeout(t)
    }
    const scan = normalizeScan(body)
    if (!scan) return
    const record = toScanRecord(scan, params)
    if (!record) return
    await deps.save(record)
  } catch {
    // never throw
  }
}