// Pure scroll maths shared by the scroll engine, the chapters and the 3D (no DOM, no clocks).

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Remap v from [a, b] to [0, 1], clamped. */
export const band = (v: number, a: number, b: number) => (b === a ? (v >= b ? 1 : 0) : clamp01((v - a) / (b - a)))

/** Smoothstep ease. */
export const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * Progress through a scroll section, 0 → 1: 0 when the section's top reaches the top of the viewport,
 * 1 when its bottom does. Sections are spacers on a fixed stage (PLAN §4.1.5), so this is the only clock
 * a transition gets: stop scrolling and it stops.
 */
export const sectionProgress = (scrollY: number, top: number, height: number) => clamp01((scrollY - top) / Math.max(1, height))

/**
 * Which registered section is current: the last one the scroll has entered (progress > 0), or the first
 * one before anything has been entered.
 */
export function activeIndex(progress: number[]) {
  let i = 0
  for (let k = 0; k < progress.length; k++) if (progress[k] > 0) i = k
  return i
}

/** Frame-rate-independent exponential approach toward `target` (λ ≈ responsiveness per second). */
export const damp = (current: number, target: number, lambda: number, dtSeconds: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dtSeconds))
