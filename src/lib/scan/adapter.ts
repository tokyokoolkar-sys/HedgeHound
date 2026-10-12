import { EMBER_REASONS, LAYOUT } from "../scent.ts"
import type { EmberList, Layout, Sector } from "../scent.ts"
import type { ScanMeta, ScanResult, ScanRow, ScanStatus } from "./types.ts"

/** A coin the layout map does not know sits in the Uncharted ring. */
export type StarSector = Sector | "uncharted"

/**
 * Semantic colour key, never a hex (CLAUDE.md rule 5). The renderer maps it to a token:
 * `scent` = the short leg is Lighter, `scan` = the short leg is Binance (PLAN §4.4).
 */
export type StarColor = "scent" | "scan"

export type Vec3 = [number, number, number]

export type LiveStar = {
  symbol: string
  sector: StarSector
  /** true when the layout map placed it; false when it sits in the Uncharted ring. */
  charted: boolean
  pos: Vec3
  blurb: string
  /** Straight from `/api/scan`. LIVE when the scan is live, SAMPLE otherwise. */
  netApr: number
  grossApr: number
  persistence: number
  /** clamp(|net_apr| / 60), 0..1. */
  brightness: number
  /** 1 - persistence, 0..1: a steadier print twinkles less. */
  twinkle: number
  color: StarColor
  long: string
  short: string
  status: ScanStatus
  stale: boolean
  n24: number
  hoursSinceFlip: number
  windowH: number
}

/** A coin the scanner filtered out on purpose. */
export type Ember = {
  symbol: string
  list: EmberList
  reason: string
  sector: "embers"
  charted: boolean
  pos: Vec3
}

export type StarField = {
  stars: LiveStar[]
  embers: Ember[]
  /** Mirrors `scan.live`: which SourceTag the figures above need. */
  source: "live" | "sample"
}

/** APR at which a star is at full brightness. */
export const FULL_BRIGHT_APR = 60

/**
 * The Uncharted ring: an ellipse in the x-y plane, outside the charted field
 * (which spans roughly x -4.4..3.6, y -3.2..2.2).
 */
export const UNCHARTED_RING = { rMin: 6.4, rMax: 8.6, squash: 0.55, zMid: -1.5, zSpread: 1 } as const

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)
const round3 = (n: number) => Math.round(n * 1000) / 1000

/** 32-bit FNV-1a. Same as `hash()` in scent.ts, kept local so this file stays pure. */
function fnv(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const unit = (s: string) => fnv(s) / 4294967296

/** Deterministic Uncharted-ring position for a symbol: same symbol, same place, always. */
export function unchartedPos(symbol: string): Vec3 {
  const { rMin, rMax, squash, zMid, zSpread } = UNCHARTED_RING
  const angle = unit(symbol) * Math.PI * 2
  const radius = rMin + unit(`${symbol}#r`) * (rMax - rMin)
  const z = zMid + (unit(`${symbol}#z`) - 0.5) * 2 * zSpread
  return [round3(Math.cos(angle) * radius), round3(Math.sin(angle) * radius * squash), round3(z)]
}

export function colorFor(row: Pick<ScanRow, "short">): StarColor {
  return row.short === "Lighter" ? "scent" : "scan"
}

type ScanInput = Pick<ScanResult, "rows" | "meta" | "live">

/** Skipped lists in a fixed order; a symbol in several lists keeps the first. */
function collectEmbers(meta: ScanMeta, layout: Record<string, Layout>): Ember[] {
  const lists: Array<[EmberList, string[] | undefined]> = [
    ["zero", meta.skipped_zero],
    ["young", meta.skipped_young],
    ["thin", meta.skipped_thin],
  ]
  const seen = new Set<string>()
  const out: Ember[] = []
  for (const [list, symbols] of lists) {
    for (const symbol of symbols ?? []) {
      if (seen.has(symbol)) continue
      seen.add(symbol)
      const entry = layout[symbol]
      out.push({
        symbol,
        list,
        reason: EMBER_REASONS[list],
        sector: "embers",
        charted: entry !== undefined,
        pos: entry ? entry.pos : unchartedPos(symbol),
      })
    }
  }
  return out
}

/**
 * Merge a scan with the layout map into renderable stars and embers (PLAN §4.4).
 *
 * - Live rows take `sector` / `pos` / `blurb` from `layout`. A symbol the layout does not
 *   know, or one the layout files under `embers` while the scanner reports it as a live
 *   row, goes to a deterministic spot in the Uncharted ring.
 * - Embers come from `meta.skipped_*`. A skipped symbol is filtered on purpose, so it is an
 *   ember even if a stale row for it is still in `rows`.
 * - brightness = clamp(|net_apr| / 60); twinkle = 1 - persistence; colour is a key.
 */
export function toStars(scan: ScanInput, layout: Record<string, Layout> = LAYOUT): StarField {
  const embers = collectEmbers(scan.meta ?? {}, layout)
  const emberSymbols = new Set(embers.map((e) => e.symbol))

  const stars: LiveStar[] = []
  for (const row of scan.rows) {
    if (emberSymbols.has(row.symbol)) continue
    const entry = layout[row.symbol]
    const placed = entry !== undefined && entry.sector !== "embers"
    stars.push({
      symbol: row.symbol,
      sector: placed ? entry.sector : "uncharted",
      charted: placed,
      pos: placed ? entry.pos : unchartedPos(row.symbol),
      blurb: placed ? entry.blurb : "",
      netApr: row.net_apr,
      grossApr: row.gross_apr,
      persistence: row.persistence,
      brightness: clamp01(Math.abs(row.net_apr) / FULL_BRIGHT_APR),
      twinkle: 1 - clamp01(row.persistence),
      color: colorFor(row),
      long: row.long,
      short: row.short,
      status: row.status,
      stale: row.stale,
      n24: row.n24,
      hoursSinceFlip: row.hours_since_flip,
      windowH: row.window_h,
    })
  }
  return { stars, embers, source: scan.live ? "live" : "sample" }
}
