// The β radar's layout (DESIGN.md "Radar", PLAN §3 β). Pure: shared by the 3D radar (objects/radar.tsx)
// and the labels projected onto it (chapters/02-sniff.tsx), so both always agree.
// Every axis means something (T15 critique, owner decision "meaningful axes"):
// - side: which venue carries the short leg (right half = short Lighter, left half = short Binance);
//   within its half a coin keeps a bearing hashed from its symbol, so it holds still across refreshes;
// - radius: signed net APR. The outer ring is break-even; louder spreads sit nearer the centre, and
//   spreads that lose after costs sit just outside the ring, dimmed and unlabelled.
import { INSTRUMENT_EXTENT, frameToWorld, makeFrame, type DockMode } from "./layout.ts"

/** Outer ring radius (break-even), in the radar's local units. */
export const R_OUT = INSTRUMENT_EXTENT
/** Most coins drawn on the radar. */
export const RADAR_MAX = 40

export type RadarInput = { symbol: string; net_apr: number; status: string; short: string }
export type RadarCoin = { symbol: string; net: number; ok: boolean; a: number; x: number; y: number }

/** 0..1 hash of a symbol (FNV-1a). */
export function symbolHash(sym: string) {
  let h = 2166136261
  for (let i = 0; i < sym.length; i++) h = Math.imul(h ^ sym.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

const HALF_MARGIN = 0.14

/** Bearing, 0..2π: the short venue picks the half, the symbol hash the place within it (clear of the axis). */
export function bearingFor(symbol: string, short: string) {
  const base = short === "Binance" ? Math.PI / 2 : -Math.PI / 2
  const a = base + HALF_MARGIN + symbolHash(symbol) * (Math.PI - 2 * HALF_MARGIN)
  return (a + Math.PI * 2) % (Math.PI * 2)
}

/** Distance from the centre by signed net APR: 60% or more sits on the inner ring; below zero, outside the ring. */
export const radiusFor = (net: number) =>
  net > 0 ? R_OUT - 0.25 - 2.8 * Math.min(1, net / 60) : R_OUT + 0.35 + 0.45 * Math.min(1, -net / 60)

/** The first `max` coins, always including `keep` (the featured coin, so the reading has a star to leave from). */
export function placeCoins(rows: RadarInput[], keep: string | null = null, max = RADAR_MAX): RadarCoin[] {
  const list = rows.slice(0, max)
  const kept = keep && !list.some((r) => r.symbol === keep) ? rows.find((r) => r.symbol === keep) : undefined
  if (kept) list[list.length - 1] = kept
  return list.map((r) => {
    const a = bearingFor(r.symbol, r.short)
    const d = radiusFor(r.net_apr)
    return { symbol: r.symbol, net: r.net_apr, ok: r.status === "ok", a, x: Math.cos(a) * d, y: Math.sin(a) * d }
  })
}

/** Label boxes are kept this far apart (radar units), so two labels never touch. */
const GAP_X = 1.5
const GAP_Y = 0.42

/**
 * Up to `n` labelled coins: the loudest positive spreads, never the featured coin (it gets the reading),
 * and never one whose label would crowd the reading's star, another label, or the half captions.
 */
export function topCoins(placed: RadarCoin[], exclude: string | null, n = 5) {
  const anchor = placed.find((k) => k.symbol === exclude)
  const taken: Array<{ x: number; y: number }> = anchor ? [anchor] : []
  const out: RadarCoin[] = []
  for (const k of [...placed].filter((c) => c.net > 0 && c.symbol !== exclude).sort((a, b) => b.net - a.net)) {
    if (out.length >= n) break
    if (Math.abs(k.y) < GAP_Y && Math.abs(k.x) > R_OUT - 1.7) continue // half captions on the axis ends
    if (taken.some((t) => Math.abs(t.x - k.x) < GAP_X && Math.abs(t.y - k.y) < GAP_Y)) continue
    taken.push(k)
    out.push(k)
  }
  return out
}

/** Where the reading docks, in radar units: right of the ring, or centred below it. */
export function dockFor(anchor: RadarCoin, mode: DockMode): [number, number] {
  return mode === "below" ? [0, -R_OUT - 0.45] : [R_OUT + 0.4, Math.max(-1.6, Math.min(1.6, anchor.y))]
}

/** The radar's transform, published by objects/radar.tsx every frame (see layout.ts). */
export const radarFrame = makeFrame()

/** A radar-local point in world space, or null while the radar is hidden. */
export const radarToWorld = (x: number, y: number) => frameToWorld(radarFrame, x, y)
