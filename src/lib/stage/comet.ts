// The δ comet trail (DESIGN.md "Comet trail", PLAN §3 δ). Pure: shared by the 3D trail
// (objects/comet-trail.tsx), the labels projected onto it and the small-multiple strips (chapters/04-trail.tsx).
// Honest by construction (owner decision a): it is drawn only from the scanner's live fields, never from
// invented points:
// - window_h:         hours of samples in the trailing day → how far back the trail reaches;
// - hours_since_flip: when the spread last changed sign → the solid part, in the current direction's colour;
//                     before that the scanner doesn't say, so it is drawn faint and dotted;
// - persistence:      share of the last 6 h that held sign and size → a bracket over the last six hours.
import { frameToWorld, makeFrame } from "./layout.ts"
import type { Point3 } from "./projector.ts"

/** The timeline covers the trailing day. */
export const DAY_H = 24
/** Persistence looks at the last six hours. */
export const RECENT_H = 6
/** Half-width of the arc and its rise, in local units: leaves room beside the ends for "24 h ago" / "now". */
export const ARC_W = 2.6
export const ARC_RISE = 1.3
export const ARC_Y0 = -0.5

export type TrailInput = { window_h: number; hours_since_flip: number; persistence: number; short: string }

export type Segment = { from: number; to: number; kind: "held" | "before" }

/** Did the sign flip inside the sampled window? (The scanner reports the window length when it didn't.) */
export const flipped = (r: TrailInput) => r.hours_since_flip < r.window_h - 0.1

/**
 * The trail as hours-ago intervals (0 = now): "held" since the last flip, "before" from the start of the
 * window up to the flip. Nothing is drawn where there are no samples.
 */
export function segments(r: TrailInput): Segment[] {
  const win = Math.min(DAY_H, Math.max(0, r.window_h))
  if (win <= 0) return []
  if (!flipped(r)) return [{ from: 0, to: win, kind: "held" }]
  const flip = Math.min(win, Math.max(0, r.hours_since_flip))
  return [
    { from: 0, to: flip, kind: "held" },
    { from: flip, to: win, kind: "before" },
  ]
}

/** The direction's colour role: short on Lighter → scent, short on Binance → scan (PLAN §4.4). */
export const directionRole = (short: string) => (short === "Binance" ? "scan" : "scent")

/** Position along the arc for hours ago (0 = now, at the right end; 24 h ago at the left end). */
export function arcPoint(hoursAgo: number): [number, number] {
  const s = 1 - Math.min(DAY_H, Math.max(0, hoursAgo)) / DAY_H
  const u = 2 * s - 1
  return [u * ARC_W, ARC_Y0 + ARC_RISE * (1 - u * u)]
}

/** Outward normal of the arc at hours ago (points up, away from the curve's inside). */
export function arcNormal(hoursAgo: number): [number, number] {
  const s = 1 - Math.min(DAY_H, Math.max(0, hoursAgo)) / DAY_H
  const u = 2 * s - 1
  // d/du of (u·W, Y0 + R(1 − u²)) = (W, −2Ru); normal = (2Ru, W) normalised.
  const nx = 2 * ARC_RISE * u
  const ny = ARC_W
  const l = Math.hypot(nx, ny)
  return [nx / l, ny / l]
}

/** A point offset from the arc along its normal (labels, the bracket). */
export function offsetPoint(hoursAgo: number, d: number): [number, number] {
  const [x, y] = arcPoint(hoursAgo)
  const [nx, ny] = arcNormal(hoursAgo)
  return [x + nx * d, y + ny * d]
}

/**
 * Draw-in: the head replays the day from the start of the window to now. Returns the hours-ago
 * position of the head for draw progress 0..1 (the trail exists only behind it).
 */
export function headAt(draw: number, r: TrailInput) {
  const win = Math.min(DAY_H, Math.max(0, r.window_h))
  const t = Math.min(1, Math.max(0, draw))
  const k = t * t * (3 - 2 * t)
  return win * (1 - k)
}

/** Mono summary used under each strip, e.g. "persist 0.97 · flip 28.4h · window 23.8h". */
export function stripLabel(r: TrailInput) {
  return `persist ${r.persistence.toFixed(2)} · ${flipped(r) ? `flip ${r.hours_since_flip.toFixed(1)}h` : "no flip"} · window ${r.window_h.toFixed(1)}h`
}

/** The trail's transform, published by objects/comet-trail.tsx every frame. */
export const trailFrame = makeFrame()

/** A trail-local point in world space, or null while it is hidden. */
export const trailToWorld = (x: number, y: number): Point3 | null => frameToWorld(trailFrame, x, y)
