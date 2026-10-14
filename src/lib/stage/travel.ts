// "travel" handover (D2 rhythm round): inside an act, the coins themselves fly from one instrument into the
// next, locked to the scroll. Pure: which seams travel, how far a seam has got, and the flight path.
// Instruments in the side box share one placement (lib/stage/layout.ts), so a point in one instrument's
// local units lands in world space the same way as a point in the next; the atlas fills the whole view.
import type { ChapterId } from "../../content/edition.ts"
import { band } from "../motion/math.ts"

export type Seam = { from: ChapterId; to: ChapterId; what: "loudest" | "kennel" | "clearing" }

/** The seams where coins travel: β→γ and γ→δ (the loudest scent), ε→ζ (the kennel coins), θ→ι (what clears your bar). */
export const TRAVEL_SEAMS: Seam[] = [
  { from: "sniff", to: "spread", what: "loudest" },
  { from: "spread", to: "trail", what: "loudest" },
  { from: "hedge", to: "kennel", what: "kennel" },
  { from: "sky", to: "den", what: "clearing" },
]

/** How far a seam has got, 0..1: lift-off over the last 14% of the first chapter, landing over the first 20% of the next. */
export const seamT = (sections: Record<string, number>, s: Seam) => 0.5 * band(sections[s.from] ?? 0, 0.86, 1) + 0.5 * band(sections[s.to] ?? 0, 0, 0.2)

/** A point on the flight, eased, rising a little through the middle so the coin visibly travels. */
export function flight(from: [number, number], to: [number, number], t: number, lift = 0.6): [number, number] {
  const k = t * t * (3 - 2 * t)
  return [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k + Math.sin(Math.PI * t) * lift]
}

/** Visible only while in flight: fades in off the first instrument and out onto the next. */
export const flightAlpha = (t: number) => (t <= 0 || t >= 1 ? 0 : Math.min(1, t / 0.12, (1 - t) / 0.12))

/** A local point of the shared side box in world space (centre and scale from layoutToWorld). */
export const boxToWorld = (at: { x: number; y: number; scale: number }, p: [number, number]): [number, number] => [at.x + p[0] * at.scale, at.y + p[1] * at.scale]
