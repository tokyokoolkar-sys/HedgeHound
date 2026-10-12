import { allRows, EMBER_REASONS, MIN_OI, MIN_VOL } from "../scent.ts"
import type { EmberList } from "../scent.ts"
import type { ScanMeta, ScanResult, ScanRow } from "./types.ts"

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d

/**
 * The labelled fallback: the static field sample from `scent.ts`, shaped like a scan.
 * `live` is false and `ts` is null, so every consumer tags it SAMPLE. Nothing here is a
 * measurement. Deterministic (seeded), so server and client render the same thing.
 */
export function sampleScan(): ScanResult {
  const rows: ScanRow[] = []
  const skipped: Record<EmberList, string[]> = { zero: [], young: [], thin: [] }

  for (const r of allRows()) {
    if (r.status === "filtered") {
      const list = (Object.keys(EMBER_REASONS) as EmberList[]).find((k) => EMBER_REASONS[k] === r.filterReason)
      if (list) skipped[list].push(r.symbol)
      continue
    }
    rows.push({
      symbol: r.symbol,
      gross_apr: round(r.grossApr, 1),
      net_apr: round(r.netApr, 1),
      persistence: round(r.persistence, 2),
      samples: Math.min(r.n24, 72),
      long: r.long,
      short: r.short,
      liq_dist: round(r.liqDist, 1),
      stale: r.stale,
      avg_spread_hr: r.status === "ok" ? r.spreadHr : null,
      avg_apr_signed: r.status === "ok" ? round(r.signedApr, 1) : null,
      hours_since_flip: r.hoursSinceFlip,
      window_h: r.windowH,
      n24: r.n24,
      status: r.status === "ok" ? "ok" : "building history",
    })
  }

  const meta: ScanMeta = {
    skipped_zero: skipped.zero,
    skipped_young: skipped.young,
    skipped_thin: skipped.thin,
    min_vol24_usd: MIN_VOL,
    min_oi_usd: MIN_OI,
  }
  return { rows, meta, live: false, ts: null, err: "scanner offline: showing the static sample" }
}
