// A second copy beat in a chapter (PLAN §4.3): it takes the place of the chapter's first copy once that
// has blurred out (ChapterDef.out), in the same left column. The heading resolves from blur, the ruled
// rows rise in sequence, and the beat blurs out upward at the end. Scroll-locked and reversible.
import { useEffect, useRef, type ReactNode } from "react"
import { band, smooth } from "@/lib/motion/math"
import { BODY_BLUR, resolveIn } from "@/lib/motion/choreo"
import type { Beat as BeatDef } from "@/content/edition"
import { isStacked } from "@/lib/stage/layout"
import { applyLook } from "./look"
import { ShimmerTitle } from "./shimmer-title"
import { useScrollFrame } from "./use-scroll-frame"

type Props = {
  section: string
  beat: BeatDef
  letter: string
  /** Timing override on stacked (phone) layouts. */
  stacked?: { in: [number, number]; out: [number, number] }
  /** Live rows (replace the content rows), and something under them (e.g. a SourceTag). The block is
   *  visual only: a chapter with live rows also renders them as screen-reader text. */
  rows?: Array<[string, ReactNode]>
  footer?: ReactNode
  /** A real link under the block (e.g. ε's "Open scanner"): focusable and clickable while the beat shows. */
  action?: ReactNode
}

export function Beat({ section, beat, letter, stacked, rows, footer, action }: Props) {
  const block = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)

  // Fit the viewport: drop trailing rows (never the footer or the note) until the block clears the HUD
  // line at the bottom. Lists here are always "top N", so a shorter list stays truthful.
  const rowCount = (rows ?? beat.rows).length
  useEffect(() => {
    const el = block.current
    if (!el) return
    const fit = () => {
      const items = Array.from(el.querySelectorAll<HTMLElement>("[data-fit]"))
      items.forEach((it) => (it.hidden = false))
      const limit = window.innerHeight - 72
      for (let i = items.length - 1; i >= 2 && el.offsetTop + el.offsetHeight > limit; i--) items[i].hidden = true
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [rowCount])

  useScrollFrame((s) => {
    const p = s.sections[section] ?? 0
    const use = stacked && isStacked(document.documentElement.clientWidth, window.innerHeight) ? stacked : beat
    const [i0, i1] = use.in
    const [o0, o1] = use.out
    if (s.reduced) {
      applyLook(block.current, { opacity: p >= i0 && p < o1 ? 1 : 0, y: 0, blur: 0 })
      return
    }
    const out = smooth(band(p, o0, o1))
    applyLook(block.current, { opacity: p > i0 ? 1 - out : 0, y: -out * 40, blur: out * BODY_BLUR })
    const span = i1 - i0
    applyLook(head.current, resolveIn(band(p, i0, i0 + span * 0.4)), false)
    const els = block.current?.querySelectorAll<HTMLElement>("[data-row]") ?? []
    const step = (span * 0.6) / Math.max(1, els.length)
    els.forEach((el, i) => {
      const t0 = i0 + span * 0.25 + i * step
      applyLook(el, resolveIn(band(p, t0, t0 + span * 0.3), 18, BODY_BLUR), false)
    })
  })

  return (
    // The block is visual only (aria-hidden), except the action; it is unreachable while the block is
    // hidden because applyLook sets visibility: hidden at zero opacity.
    <div
      ref={block}
      className="pointer-events-none fixed top-[16svh] left-[max(16px,7vw)] z-10 w-[min(500px,calc(100%_-_2*max(16px,7vw)))]"
      style={{ visibility: "hidden" }}
    >
      <div ref={head} aria-hidden="true">
        <p className="label m-0 text-starlight-dim">
          <span className="bayer mr-1">{letter}</span> · {beat.kicker}
        </p>
        <div className="mt-3">
          <ShimmerTitle as="h3" size="title">
            {beat.title}
          </ShimmerTitle>
        </div>
      </div>
      <dl aria-hidden="true" className="m-0 mt-6 grid">
        {(rows ?? beat.rows).map(([k, v]) => (
          <div key={k} data-row data-fit className="grid grid-cols-[6.5rem_1fr] items-baseline gap-3 border-t border-starlight-faint py-3">
            <dt className="label text-starlight-dim">{k}</dt>
            <dd className="text-body m-0 text-starlight">{v}</dd>
          </div>
        ))}
      </dl>
      {footer && (
        <div data-row aria-hidden="true" className="mt-4">
          {footer}
        </div>
      )}
      {beat.note && (
        <p data-row aria-hidden="true" className="label mt-4 mb-0 text-starlight-dim">
          {beat.note}
        </p>
      )}
      {action && (
        <div data-row className="pointer-events-auto mt-2">
          {action}
        </div>
      )}
    </div>
  )
}
