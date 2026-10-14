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

export type CopyOpts = {
  vh: number
  reduced: boolean
  last?: boolean
  riseBand?: [number, number]
  /** Progress band over which the block blurs out upward (default [0.86, 1]). */
  outBand?: [number, number]
  /** Body items: "stack" (rise in sequence and stay) or "swap" (one at a time, in place; narrow screens). */
  items?: "stack" | "swap"
  /** Number of body items (needed for "swap", so the last one holds). */
  count?: number
  /** Skip the blur-out: the chapter's exit is handled elsewhere (a following crawl carries it out). */
  holdOut?: boolean
}

/** Body copy never blurs past this (px): beyond ~3px a paragraph turns into grey fog (T15 critique). */
export const BODY_BLUR = 3

/** Swap slot: item i takes over from item i − 1 every 0.14 of progress, starting at 0.10. */
const SWAP_START = 0.1
const SWAP_SLOT = 0.14

/** Reduced motion, swapped items: no transition, but still one at a time (they share one place). */
const swapShown = (p: number, i: number, n: number) =>
  p >= SWAP_START + i * SWAP_SLOT && (i >= n - 1 || p < SWAP_START + (i + 1) * SWAP_SLOT)

/** One-at-a-time body item: rises in, holds, then blurs out upward as the next one arrives. The last one holds. */
export function swapItem(p: number, i: number, n: number): Look {
  const t0 = SWAP_START + i * SWAP_SLOT
  // In over 0.05, hold, out over the last 0.035 of the slot: the next one only starts once this is gone.
  const inLook = resolveIn(band(p, t0, t0 + 0.05), 26, BODY_BLUR)
  if (i >= n - 1) return inLook
  const k = smooth(band(p, t0 + SWAP_SLOT - 0.035, t0 + SWAP_SLOT))
  return { opacity: inLook.opacity * (1 - k), y: inLook.y - k * 24, blur: inLook.blur + k * BODY_BLUR }
}

/**
 * Copy state for a chapter at progress `p` (0..1 through its own section).
 * - fade/crawl: the block holds still; title, subtitle and items resolve in sequence.
 * - rise: the block travels up from below the screen (vh = viewport height in px), no other effect.
 * - every chapter blurs out upward over `outBand` (default the last 14%), except the last one (`last`).
 */
export function copyFrame(p: number, mode: "fade" | "crawl" | "rise", opts: CopyOpts): CopyFrame {
  const { vh, reduced, last } = opts
  const [r0, r1] = opts.riseBand ?? [0, 0.16]
  const [o0, o1] = opts.outBand ?? [0.86, 1]
  if (reduced) {
    const on = p > 0 && (last || p < o1) ? SHOWN : HIDDEN
    const item = (i: number) => (opts.items !== "swap" || swapShown(p, i, opts.count ?? 1) ? SHOWN : HIDDEN)
    return { block: on, title: SHOWN, subtitle: SHOWN, item }
  }
  const out = last || opts.holdOut ? 0 : smooth(band(p, o0, o1))
  // Copy appears only once its section has started (the overture's first paint is handled by its chapter).
  const visible = mode === "rise" ? p > r0 : p > 0
  const block: Look = {
    opacity: visible ? 1 - out : 0,
    y: (mode === "rise" ? (1 - smooth(band(p, r0, r1))) * vh * 0.95 : 0) - out * 40,
    blur: out * BODY_BLUR,
  }
  if (mode === "rise") return { block, title: SHOWN, subtitle: SHOWN, item: () => SHOWN }
  return {
    block,
    title: resolveIn(band(p, 0, 0.14)),
    subtitle: resolveIn(band(p, 0.06, 0.2), 10, 10),
    item: (i) => (opts.items === "swap" ? swapItem(p, i, opts.count ?? 1) : resolveIn(band(p, 0.16 + i * 0.07, 0.34 + i * 0.07), 26, BODY_BLUR)),
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
