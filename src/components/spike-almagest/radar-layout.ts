// Radar placement shared by the 3D radar (sky.tsx) and the page's DOM labels (spike D1).
// Labels are plain page elements projected onto the radar each frame, not drei <Html> roots:
// those remount when the data refreshes and can leave orphaned copies on screen.
import type { RadarCoin } from "./sky"

export const R_OUT = 3.6

function hashAngle(sym: string) {
  let h = 2166136261
  for (let i = 0; i < sym.length; i++) h = Math.imul(h ^ sym.charCodeAt(i), 16777619)
  return ((h >>> 0) / 4294967296) * Math.PI * 2
}

export type Placed = RadarCoin & { a: number; x: number; y: number }

/** Angle by symbol; louder spreads sit closer to the centre. */
export function placeCoins(coins: RadarCoin[]): Placed[] {
  return coins.slice(0, 40).map((c) => {
    const a = hashAngle(c.symbol)
    const r = R_OUT - 2.8 * Math.min(1, Math.abs(c.net) / 60) - 0.25
    return { ...c, a, x: Math.cos(a) * r, y: Math.sin(a) * r }
  })
}

export function topCoins(placed: Placed[], exclude?: string) {
  return [...placed]
    .filter((k) => k.symbol !== exclude)
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
    .slice(0, 5)
}

/** Where the reading sits: outside the ring (right on desktop, below on mobile). */
export function dockFor(anchor: Placed | null, mobile: boolean): [number, number] {
  if (!anchor) return [0, 0]
  return mobile ? [0, -R_OUT - 0.5] : [R_OUT + 0.35, Math.max(-1.6, Math.min(1.6, anchor.y))]
}
