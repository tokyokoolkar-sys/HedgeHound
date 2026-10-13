// Copy choreography as pure functions of scroll progress (PLAN §4.3). No clocks, no DOM.
// Values from D1: titles resolve from blur, body items rise in sequence, copy blurs out upward at the end.
import { band, smooth } from "./math.ts"

export type Look = { opacity: number; y: number; blur: number }

const HIDDEN: Look = { opacity: 0, y: 0, blur: 0 }
const SHOWN: Look = { opacity: 1, y: 0, blur: 0 }

/** A resolve-in look: blur → sharp, small rise (y in px). */
export function resolveIn(t: number, rise = 14, blur = 12): Look {
  const k = smooth(t)
  return { opacity: k, y: (1 - k) * rise, blur: (1 - k) * blur }
}

export type CopyFrame = {
  /** Whole copy block. y in px (negative = up). */
  block: Look
  title: Look
  subtitle: Look
  /** Look for body item i. */
  item: (i: number) => Look
}

/**
 * Copy state for a chapter at progress `p` (0..1 through its own section).
 * - fade/crawl: the block holds still; title, subtitle and items resolve in sequence.
 * - rise: the block travels up from below the screen (vh = viewport height in px), no other effect.
 * - every chapter blurs out upward over the last 14%, except the last one (`last`).
 */
export function copyFrame(
  p: number,
  mode: "fade" | "crawl" | "rise",
  opts: { vh: number; reduced: boolean; last?: boolean; riseBand?: [number, number] },
): CopyFrame {
  const { vh, reduced, last } = opts
  const [r0, r1] = opts.riseBand ?? [0, 0.16]
  if (reduced) {
    const on = p > 0 && (last || p < 1) ? SHOWN : HIDDEN
    return { block: on, title: SHOWN, subtitle: SHOWN, item: () => SHOWN }
  }
  const out = last ? 0 : smooth(band(p, 0.86, 1))
  // Copy appears only once its section has started (the overture's first paint is handled by its chapter).
  const visible = mode === "rise" ? p > r0 : p > 0
  const block: Look = {
    opacity: visible ? 1 - out : 0,
    y: (mode === "rise" ? (1 - smooth(band(p, r0, r1))) * vh * 0.95 : 0) - out * 40,
    blur: out * 10,
  }
  if (mode === "rise") return { block, title: SHOWN, subtitle: SHOWN, item: () => SHOWN }
  return {
    block,
    title: resolveIn(band(p, 0, 0.14)),
    subtitle: resolveIn(band(p, 0.06, 0.2), 10, 10),
    item: (i) => resolveIn(band(p, 0.16 + i * 0.07, 0.34 + i * 0.07), 26, 12),
  }
}

/** Crawl front for the DOM bite masks: viewport-relative height (0 = bottom, 1 = top), or null when idle. */
export function crawlFront(t: number): { front: number | null; mode: "out" | "in" } {
  if (t <= 0 || t >= 1) return { front: null, mode: "out" }
  return t < 0.5 ? { front: -0.3 + 1.6 * (t * 2), mode: "out" } : { front: -0.3 + 1.6 * ((t - 0.5) * 2), mode: "in" }
}

/**
 * Word-by-word resolve (D1): word i of n at progress q. Each word blurs in, staggered across the line.
 */
export function wordLook(q: number, i: number, n: number): Look {
  const step = Math.min(0.08, 0.6 / Math.max(1, n))
  const t = band(q * (1 + n * step) - i * step, 0, 1)
  const k = smooth(t)
  return { opacity: k, y: (1 - k) * 4, blur: (1 - k) * 14 }
}
