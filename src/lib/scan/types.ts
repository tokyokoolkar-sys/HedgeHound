import { DEFAULT_BOOK } from "../scent.ts"

/**
 * Shapes of the local scanner's `GET /api/scan` (verified against a recorded response in
 * `__fixtures__/scan.json`; PLAN §1, WhaleHunterAlt `docs/FINDINGS.md`).
 *
 * Wire types use the scanner's own snake_case names. `ScanResult` is what the UI sees:
 * `ts` is converted from epoch seconds (scanner) to epoch milliseconds (UI, `SourceTag`).
 */

/** `ok` rows are alert-eligible; `building history` rows are snapshot only. */
export type ScanStatus = "ok" | "building history"

export type ScanRow = {
  symbol: string
  gross_apr: number
  net_apr: number
  /** 0..1, share of the last 6 h whose sign and size held. */
  persistence: number
  samples: number
  /** Venue to be long / short, e.g. "Lighter" or "Binance". */
  long: string
  short: string
  liq_dist: number
  stale: boolean
  /** Day-average hourly spread (Lighter minus Binance); null while building history. */
  avg_spread_hr: number | null
  avg_apr_signed: number | null
  hours_since_flip: number
  window_h: number
  /** Samples in the trailing 24 h; 144 earns `ok`. */
  n24: number
  status: ScanStatus
  /**
   * T41: the latest HOURLY funding rate on each venue (Lighter already /8, Binance /interval), and each venue's
   * 24 h volume and open interest in USD. Null from an older scanner, for SAMPLE, or while unknown.
   */
  lighter_hr: number | null
  binance_hr: number | null
  lighter_vol24_usd: number | null
  lighter_oi_usd: number | null
  binance_vol24_usd: number | null
  binance_oi_usd: number | null
}

export type ScanMeta = {
  divisor?: number
  assumed8?: string[]
  /** Coins filtered out on purpose (cold embers), one list per reason. */
  skipped_zero?: string[]
  skipped_young?: string[]
  skipped_thin?: string[]
  min_vol24_usd?: number
  min_oi_usd?: number
}

/** The raw JSON body. `ts` is epoch SECONDS (0 until the first poll completes). */
export type ScanWire = {
  rows: ScanRow[]
  err: string | null
  ts: number
  meta?: ScanMeta
}

/** Query inputs. These are the knobs `/api/scan` takes, and they form the query key. */
export type ScanParams = {
  min: number
  hold: number
  /** Round-trip cost in percent of notional (`/api/scan?cost=`). */
  cost: number
  lev: number
}

/**
 * `min`, `hold`, `lev` as in the WhaleHunterAlt page this was ported from. `cost` is the
 * Edition's `DEFAULT_BOOK` cost (0.30), not the server's own default (0.2), so live and
 * sample nets are computed with the same round-trip cost.
 */
export const DEFAULT_SCAN_PARAMS: ScanParams = { min: 1, hold: 72, cost: DEFAULT_BOOK.cost, lev: 2 }

/** The scanner polls the exchanges every 300 s. */
export const SCANNER_POLL_SECONDS = 300

export type ScanResult = {
  rows: ScanRow[]
  meta: ScanMeta
  /**
   * true only for a clean answer from the running scanner (no `err`, a completed poll).
   * false means SAMPLE: the labelled static fallback, or a scanner that reports an error.
   */
  live: boolean
  /** Epoch milliseconds of the scanner's last completed poll; null for SAMPLE. */
  ts: number | null
  /** The scanner's own error text, or why the sample is showing. */
  err: string | null
  /**
   * Consecutive fallback answers in a row (0 after a live one). Set by `useScan` and read
   * by the refetch interval to back off while the scanner is off.
   */
  misses?: number
}
