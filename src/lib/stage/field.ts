// The ε field chart (DESIGN.md "Field chart", PLAN §3 ε). Pure: shared by the 3D chart
// (objects/field-chart.tsx) and the labels projected onto it (chapters/05-hedge.tsx).
// Every live coin is a star on two honest axes, straight from the scanner:
// - across: net APR after costs (linear, clamped at the ends), with a hairline at break-even;
// - up:     persistence, the share of the last 6 h that held sign and size.
// Up and to the right pays and stays. No "good zone" is drawn: the scanner has no persistence threshold.
import { frameToWorld, makeFrame } from "./layout.ts"
import type { Point3 } from "./projector.ts"
import { symbolHash } from "./radar.ts"

/** Half-width / half-height of the plot area, in local units (fits the instrument layout box with labels). */
export const FIELD_W = 3.0
export const FIELD_H = 1.6
/** Net APR domain (%), clamped: losses compress to the left edge, very loud spreads to the right edge. */
export const NET_LO = -40
export const NET_HI = 60
/** Ticks along the net axis (%). */
export const NET_TICKS = [-20, 0, 20, 40, 60]
export const FIELD_MAX = 40

export type FieldInput = { symbol: string; net_apr: number; persistence: number; status: string }
export type FieldStar = { symbol: string; net: number; ok: boolean; x: number; y: number; sx: number; sy: number; size: number }

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** x for a net APR (%). */
export const netX = (net: number) => -FIELD_W + 2 * FIELD_W * clamp01((net - NET_LO) / (NET_HI - NET_LO))
/** y for a persistence share (0..1). */
export const heldY = (p: number) => -FIELD_H + 2 * FIELD_H * clamp01(p)

/** Every coin on the chart (at most FIELD_MAX), with a scattered start position it gathers from. */
export function placeField(rows: FieldInput[], max = FIELD_MAX): FieldStar[] {
  return rows.slice(0, max).map((r) => {
    const h = symbolHash(r.symbol)
    const a = h * Math.PI * 2
    const d = 3.5 + symbolHash(r.symbol + "·") * 3
    return {
      symbol: r.symbol,
      net: r.net_apr,
      ok: r.status === "ok",
      x: netX(r.net_apr),
      y: heldY(r.persistence),
      sx: Math.cos(a) * d,
      sy: Math.sin(a) * d * 0.6,
      size: r.net_apr > 0 ? 5 + Math.min(1, r.net_apr / 60) * 8 : 4,
    }
  })
}

/** Label width and minimum vertical gap, in chart units (symbol + net in mono). */
const LABEL_W = 1.9
const GAP_Y = 0.36

/** Labels run right of their star; near the right edge they turn back (left). */
export const fieldLabelSide = (k: { x: number }) => (k.x > FIELD_W - 1.5 ? "left" : "right")
const span = (k: FieldStar): [number, number] => (fieldLabelSide(k) === "right" ? [k.x, k.x + LABEL_W] : [k.x - LABEL_W, k.x])

/** Up to `n` labelled coins: the loudest that clear their costs; no two label boxes overlap (side-aware). */
export function labelled(stars: FieldStar[], n = 5) {
  const out: FieldStar[] = []
  for (const k of stars.filter((s) => s.net > 0).sort((a, b) => b.net - a.net)) {
    if (out.length >= n) break
    const [a0, a1] = span(k)
    if (out.some((t) => Math.abs(t.y - k.y) < GAP_Y && a0 < span(t)[1] && span(t)[0] < a1)) continue
    out.push(k)
  }
  return out
}

/** Held under half of the last six hours: shown as "shaky" in the shortlist (a note, not a filter). */
export const SHAKY_BELOW = 0.5

/** The shortlist: coins that clear their costs, clean ones first, each group loudest first. */
export function shortlist<T extends { net_apr: number; status: string }>(rows: T[], n = 8): T[] {
  return rows
    .filter((r) => r.net_apr > 0)
    .sort((a, b) => Number(b.status === "ok") - Number(a.status === "ok") || b.net_apr - a.net_apr)
    .slice(0, n)
}

/** Mono tick text for a net value: true minus, no plus sign. */
export const tickText = (net: number) => (net < 0 ? `−${Math.abs(net)}` : String(net))

/** The chart's transform, published by objects/field-chart.tsx every frame. */
export const fieldFrame = makeFrame()

/** A chart-local point in world space, or null while it is hidden. */
export const fieldToWorld = (x: number, y: number): Point3 | null => frameToWorld(fieldFrame, x, y)
