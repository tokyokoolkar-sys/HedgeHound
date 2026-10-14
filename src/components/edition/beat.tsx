// A second copy beat in a chapter (PLAN §4.3): it takes the place of the chapter's first copy once that
// has blurred out (ChapterDef.out), in the same left column. The heading resolves from blur, the ruled
// rows rise in sequence, and the beat blurs out upward at the end. Scroll-locked and reversible.
import { useRef, type ReactNode } from "react"
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
}

export function Beat({ section, beat, letter, stacked, rows, footer }: Props) {
  const block = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)

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
    <div
      ref={block}
      aria-hidden="true"
      className="pointer-events-none fixed top-[16svh] left-[max(16px,7vw)] z-10 w-[min(500px,calc(100%_-_2*max(16px,7vw)))]"
      style={{ visibility: "hidden" }}
    >
      <div ref={head}>
        <p className="label m-0 text-starlight-dim">
          <span className="bayer mr-1">{letter}</span> · {beat.kicker}
        </p>
        <div className="mt-3">
          <ShimmerTitle as="h3" size="title">
            {beat.title}
          </ShimmerTitle>
        </div>
      </div>
      <dl className="m-0 mt-6 grid">
        {(rows ?? beat.rows).map(([k, v]) => (
          <div key={k} data-row className="grid grid-cols-[6.5rem_1fr] items-baseline gap-3 border-t border-starlight-faint py-3">
            <dt className="label text-starlight-dim">{k}</dt>
            <dd className="text-body m-0 text-starlight">{v}</dd>
          </div>
        ))}
      </dl>
      {footer && (
        <div data-row className="mt-4">
          {footer}
        </div>
      )}
      {beat.note && (
        <p data-row className="label mt-4 mb-0 text-starlight-dim">
          {beat.note}
        </p>
      )}
    </div>
  )
}
