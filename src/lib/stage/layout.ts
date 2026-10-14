// Where a chapter's instrument sits for a viewport (DESIGN.md Layout), shared by every instrument (radar,
// astrolabe, …) and the labels projected onto it. Pure. Desktop keeps the instrument clear of the copy
// column (gutter + 500 px); stacked layouts (phones, portrait tablets) take turns with the copy instead.
// Instruments are drawn in local units where INSTRUMENT_EXTENT reaches the layout's radius `r`.
import type { Point3 } from "./projector.ts"

/** Local units from the instrument's centre to the edge of its layout box (its "radius"). */
export const INSTRUMENT_EXTENT = 3.6

export type DockMode = "right" | "below"

export type InstrumentLayout = {
  mode: "wide" | "mid" | "narrow"
  dock: DockMode
  /** Centre and outer-ring radius in CSS px. */
  cx: number
  cy: number
  r: number
  labels: number
}

/** Space kept for a reading beside the instrument (its widest line is a symbol in title type). */
const READING_W = 260

/**
 * Where the instrument sits for a viewport (CSS px). Desktop keeps it clear of the copy column with room
 * for a reading docked to the right; when that leaves too small an instrument, the reading moves below
 * it; phones stack it under the copy.
 */
export function instrumentLayout(w: number, h: number): InstrumentLayout {
  const gutter = Math.max(16, 0.07 * w)
  // Stacked: this is the featured state (the instrument on its own, caption above, reading below);
  // `tucked` gives the small rings-only state under the copy that it grows from.
  const stacked = (): InstrumentLayout => {
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

/** Stacked layouts only: the small, quiet instrument under the copy, before it is featured. */
export function tucked(l: InstrumentLayout, h: number): InstrumentLayout {
  const r = l.r * 0.6
  return { ...l, r, cy: 0.58 * h + r }
}

/** Blend two layouts (position and size), t = 0 → a, 1 → b. */
export function mixLayout(a: InstrumentLayout, b: InstrumentLayout, t: number): InstrumentLayout {
  const m = (x: number, y: number) => x + (y - x) * t
  return { ...b, cx: m(a.cx, b.cx), cy: m(a.cy, b.cy), r: m(a.r, b.r) }
}

/** The stacked (phone) arrangement: copy, instrument and second beat take turns. */
export const isStacked = (w: number, h: number) => instrumentLayout(w, h).mode === "narrow"

/** World-space centre and scale for a layout, on the z = 0 plane of the default camera (z 10, fov 45). */
export function layoutToWorld(l: InstrumentLayout, w: number, h: number) {
  const unit = h / (2 * 10 * Math.tan((45 / 2) * (Math.PI / 180)))
  return { x: (l.cx - w / 2) / unit, y: (h / 2 - l.cy) / unit, scale: l.r / (INSTRUMENT_EXTENT * unit) }
}

/**
 * An instrument's local → world transform, written by its 3D object every frame before the Projector
 * runs, so projected labels can pin themselves to local coordinates. `matrix` is column-major (three.js).
 */
export type InstrumentFrame = { matrix: ArrayLike<number> | null; visible: boolean }

export const makeFrame = (): InstrumentFrame => ({ matrix: null, visible: false })

/** A local point in world space, or null while the instrument is hidden. */
export function frameToWorld(frame: InstrumentFrame, x: number, y: number): Point3 | null {
  const m = frame.matrix
  if (!frame.visible || !m) return null
  const w = m[3] * x + m[7] * y + m[15] || 1
  return [(m[0] * x + m[4] * y + m[12]) / w, (m[1] * x + m[5] * y + m[13]) / w, (m[2] * x + m[6] * y + m[14]) / w]
}
