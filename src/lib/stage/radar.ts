// The β radar's layout (DESIGN.md "Radar", PLAN §3 β). Pure: shared by the 3D radar (objects/radar.tsx)
// and the labels projected onto it (chapters/02-sniff.tsx), so both always agree.
// Every axis means something (T15 critique, owner decision "meaningful axes"):
// - side: which venue carries the short leg (right half = short Lighter, left half = short Binance);
//   within its half a coin keeps a bearing hashed from its symbol, so it holds still across refreshes;
// - radius: signed net APR. The outer ring is break-even; louder spreads sit nearer the centre, and
//   spreads that lose after costs sit just outside the ring, dimmed and unlabelled.
import type { Point3 } from "./projector.ts"

/** Outer ring radius (break-even), in the radar's local units. */
export const R_OUT = 3.6
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

export type DockMode = "right" | "below"

/** Where the reading docks, in radar units: right of the ring, or centred below it. */
export function dockFor(anchor: RadarCoin, mode: DockMode): [number, number] {
  return mode === "below" ? [0, -R_OUT - 0.45] : [R_OUT + 0.4, Math.max(-1.6, Math.min(1.6, anchor.y))]
}

export type RadarLayout = {
  mode: "wide" | "mid" | "narrow"
  dock: DockMode
  /** Centre and outer-ring radius in CSS px. */
  cx: number
  cy: number
  r: number
  labels: number
}

/** Space kept for the reading beside the ring (its widest line is the symbol in title type). */
const READING_W = 260

/**
 * Where the radar sits for a viewport (CSS px). Desktop keeps it clear of the copy column
 * (gutter + 500 px) with the reading docked to the right; when that leaves too small a ring, the
 * reading moves below it; phones stack it under the copy.
 */
export function radarLayout(w: number, h: number): RadarLayout {
  const gutter = Math.max(16, 0.07 * w)
  // Stacked: this is the featured state (the radar on its own, caption above, reading below);
  // `tucked` gives the small rings-only state under the copy that it grows from.
  const stacked = (): RadarLayout => {
    const r = Math.min(0.4 * w, 0.19 * h, w < 768 ? 170 : 220)
    return { mode: "narrow", dock: "below", cx: w / 2, cy: 0.44 * h, r, labels: w < 768 ? 3 : 5 }
  }
  if (w < 768) return stacked()
  const left = gutter + Math.min(500, w - 2 * gutter) + 48
  const wideRight = w - gutter - READING_W
  const wideR = Math.min((wideRight - left) / 2 - 16, 0.3 * h)
  if (wideR >= 170) return { mode: "wide", dock: "right", cx: (left + wideRight) / 2, cy: 0.5 * h, r: wideR, labels: 5 }
  const right = w - gutter
  const r = Math.min((right - left) / 2 - 12, 0.27 * h)
  // Too little room beside the copy (portrait tablets): stack it like a phone.
  if (r < 120) return stacked()
  return { mode: "mid", dock: "below", cx: (left + right) / 2, cy: 0.42 * h, r, labels: 5 }
}

/** Stacked layouts only: the small rings-only radar under the copy, before it is featured. */
export function tucked(l: RadarLayout, h: number): RadarLayout {
  const r = l.r * 0.6
  return { ...l, r, cy: 0.58 * h + r }
}

/** Blend two layouts (position and size), t = 0 → a, 1 → b. */
export function mixLayout(a: RadarLayout, b: RadarLayout, t: number): RadarLayout {
  const m = (x: number, y: number) => x + (y - x) * t
  return { ...b, cx: m(a.cx, b.cx), cy: m(a.cy, b.cy), r: m(a.r, b.r) }
}

/** The stacked (phone) arrangement: copy steps take turns and the radar leaves before the second beat. */
export const isStacked = (w: number, h: number) => radarLayout(w, h).mode === "narrow"

/** World-space centre and scale for a layout, on the z = 0 plane of the default camera (z 10, fov 45). */
export function layoutToWorld(l: RadarLayout, w: number, h: number) {
  const unit = h / (2 * 10 * Math.tan((45 / 2) * (Math.PI / 180)))
  return { x: (l.cx - w / 2) / unit, y: (h / 2 - l.cy) / unit, scale: l.r / (R_OUT * unit) }
}

/**
 * The radar's local → world transform, written by the 3D radar every frame before the Projector runs,
 * so projected labels can pin themselves to radar coordinates. `matrix` is column-major (three.js order).
 */
export const radarFrame: { matrix: ArrayLike<number> | null; visible: boolean } = { matrix: null, visible: false }

/** A radar-local point in world space, or null while the radar is hidden. */
export function radarToWorld(x: number, y: number, frame = radarFrame): Point3 | null {
  const m = frame.matrix
  if (!frame.visible || !m) return null
  const w = m[3] * x + m[7] * y + m[15] || 1
  return [(m[0] * x + m[4] * y + m[12]) / w, (m[1] * x + m[5] * y + m[13]) / w, (m[2] * x + m[6] * y + m[14]) / w]
}
