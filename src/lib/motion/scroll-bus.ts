// Non-component hooks into the scroll engine (S5: keep these out of the component module).

type Lenis = { scrollTo: (target: number | HTMLElement, opts?: { immediate?: boolean; offset?: number; force?: boolean }) => void; resize: () => void }

let lenis: Lenis | null = null

/**
 * Callbacks run on every engine tick, right after Lenis has advanced and section progress has been
 * written. SkyStage (T12) renders from here so the 3D and the DOM agree on the same frame (S5: no lag).
 */
export const afterScroll = new Set<(timeMs: number) => void>()

export const setLenis = (l: Lenis | null) => void (lenis = l)

/** The active Lenis instance, or null (reduced motion, or before the engine mounts). */
export const getLenis = () => lenis

/** Scroll to a position or element, smoothly when Lenis is active, natively otherwise. */
export function scrollToTarget(target: number | HTMLElement, opts: { immediate?: boolean; offset?: number } = {}) {
  if (lenis) {
    // Right after a route change Lenis may still hold the previous page's scroll limit (e.g. 0 on /scanner),
    // and would clamp the jump to it: measure first.
    if (opts.immediate) lenis.resize()
    return lenis.scrollTo(target, { ...opts, force: true })
  }
  const y = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0)
  window.scrollTo({ top: y, behavior: opts.immediate ? "instant" : "smooth" })
}
