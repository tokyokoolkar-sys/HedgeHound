// The γ astrolabe's geometry (DESIGN.md "Astrolabe", PLAN §3 γ). Pure: shared by the 3D object
// (objects/hedge-astrolabe.tsx) and the labels projected onto it (chapters/03-spread.tsx).
// One coin, two legs: a cyan ring (long) and an orange ring (short) start concentric around the coin,
// then slide apart into the two venues. A price swing then moves both legs together: the gap between
// them, which is the spread, never changes length. That is the chapter's whole point, drawn.
import { INSTRUMENT_EXTENT, frameToWorld, makeFrame } from "./layout.ts"
import type { Point3 } from "./projector.ts"

/** Ring radii in local units: the long leg inside, the short leg outside, so both read when concentric. */
export const R_LONG = 1.05
export const R_SHORT = 1.3
/** How far each leg travels from the centre when fully split. */
export const SPLIT = 2.0
/** Height of the price swing (local units). */
export const SWING = 0.55
/** Ticks per ring. */
export const TICKS = 48

const smooth = (t: number) => t * t * (3 - 2 * t)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Each leg's distance from the centre for split progress 0..1 (long goes left, short goes right). */
export const legOffset = (split: number) => SPLIT * smooth(clamp01(split))

/** Shared vertical offset for swing progress 0..1: one full price swing, up then down, back to rest. */
export function swingY(t: number) {
  const k = clamp01(t)
  return Math.sin(k * Math.PI * 2) * SWING * Math.sin(k * Math.PI)
}

/** Ring rotation (radians) for scroll progress: counter-rotating, locked to the scroll. */
export const turnFor = (p: number) => p * Math.PI * 1.2

export type Legs = { long: [number, number]; short: [number, number] }

/** Where the two legs' centres are, in local units. */
export function legs(split: number, swing: number): Legs {
  const d = legOffset(split)
  const y = swingY(swing)
  return { long: [-d, y], short: [d, y] }
}

/** Furthest point the astrolabe reaches from its centre (must fit the instrument layout). */
export const reach = () => Math.hypot(SPLIT + R_SHORT, SWING) + 0.1

if (reach() > INSTRUMENT_EXTENT + 0.05) throw new Error("astrolabe overflows its layout box")

/** The astrolabe's transform, published by objects/hedge-astrolabe.tsx every frame. */
export const astrolabeFrame = makeFrame()

/** An astrolabe-local point in world space, or null while it is hidden. */
export const astrolabeToWorld = (x: number, y: number): Point3 | null => frameToWorld(astrolabeFrame, x, y)
