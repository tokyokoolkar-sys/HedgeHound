// A chapter of the Edition (PLAN §4.3, fixed-stage model). It registers its scroll section(s) and puts
// its copy on a fixed layer above the sky; the copy follows the section's progress every frame.
// - enter "crawl": an extra section before it drives the bite crawl; the copy is rebuilt cell by cell.
// - enter "rise": the copy travels up from below the screen with the scroll (no effect of its own).
// - `exitInto`: the next chapter's crawl section; the copy carries on up and out while the crawl eats the sky.
import { useRef, type ReactNode } from "react"
import { cn } from "@/lib/cn"
import { band, smooth } from "@/lib/motion/math"
import { copyFrame, crawlFront, resolveIn } from "@/lib/motion/choreo"
import { useSection } from "@/lib/motion/scroll-progress"
import { enterId, type ChapterDef } from "@/content/edition"
import { applyLook } from "./look"
import { applyCrawl } from "./masks"
import { ShimmerTitle } from "./shimmer-title"
import { useScrollFrame } from "./use-scroll-frame"

type Props = {
  def: ChapterDef
  /** Section id of the next chapter's crawl, if any (the copy exits upward during it). */
  exitInto?: string
  last?: boolean
  children?: ReactNode
}

function Spacer({ id, length, domId }: { id: string; length: string; domId: string }) {
  const ref = useSection(id)
  return <section ref={ref} id={domId} aria-hidden="true" style={{ height: length }} />
}

export function Chapter({ def, exitInto, last, children }: Props) {
  const block = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLDivElement>(null)
  const subtitle = useRef<HTMLParagraphElement>(null)
  const items = useRef<HTMLDivElement>(null)
  const isOverture = def.id === "overture"

  useScrollFrame((s) => {
    const el = block.current
    if (!el) return
    const vh = window.innerHeight
    const p = s.sections[def.id] ?? 0
    const enter = def.enter === "crawl" ? (s.sections[enterId(def.id)] ?? 0) : 0
    const f = copyFrame(p, def.enter, { vh, reduced: s.reduced, last })
    let look = f.block

    if (def.enter === "crawl" && !s.reduced) {
      // Visible from the middle of the crawl, rebuilt by the bites (DOM half of the crawl).
      const rebuilding = enter >= 0.5 && p <= 0
      if (rebuilding) look = { opacity: 1, y: 0, blur: 0 }
      const { front, mode } = crawlFront(p > 0 ? 1 : enter)
      applyCrawl(el, mode === "in" ? front : null, "in")
    }
    if (exitInto && !s.reduced) {
      // Carry on up and out while the next chapter's crawl eats the sky behind.
      const t = s.sections[exitInto] ?? 0
      // Fades early so it never crosses the nav on its way out.
      if (p >= 1 && t < 0.42) look = { opacity: 1 - band(t, 0.04, 0.22), y: -smooth(band(t, 0, 0.42)) * vh * 1.05, blur: 0 }
      else if (p >= 1) look = { opacity: 0, y: 0, blur: 0 }
    }
    if (isOverture) look = s.reduced ? { opacity: p < 0.5 ? 1 : 0, y: 0, blur: 0 } : { opacity: 1 - band(p, 0.3, 0.5), y: -band(p, 0, 0.5) * 60, blur: 0 }
    applyLook(el, look)

    if (def.enter !== "rise" && !isOverture) {
      const titleT = def.enter === "crawl" ? 0.5 * band(enter, 0.8, 1) + 0.5 * band(p, 0, 0.14) : band(p, 0, 0.14)
      applyLook(title.current, s.reduced ? resolveIn(1) : resolveIn(p > 0 || enter > 0 ? titleT : 0), false)
      applyLook(subtitle.current, f.subtitle, false)
      items.current?.querySelectorAll<HTMLElement>("[data-item]").forEach((it, i) => applyLook(it, f.item(i), false))
    }
  })

  const position =
    def.layout === "center"
      ? "inset-x-0 bottom-[16svh] flex flex-col items-center px-4 text-center"
      : def.anchor === "bottom"
        ? "left-[max(16px,7vw)] bottom-[9svh] w-[min(500px,calc(100%_-_2*max(16px,7vw)))]"
        : "left-[max(16px,7vw)] top-[16svh] w-[min(500px,calc(100%_-_2*max(16px,7vw)))]"

  return (
    <>
      {def.enter === "crawl" && def.enterLength && <Spacer id={enterId(def.id)} domId={`chapter-${def.id}-enter`} length={def.enterLength} />}
      <Spacer id={def.id} domId={`chapter-${def.id}`} length={def.length} />

      <div
        ref={block}
        className={cn("pointer-events-none fixed z-10", position)}
        // The overture is visible on first paint (SSR, LCP = hero title); everything else waits for the scroll.
        style={{ visibility: isOverture ? "visible" : "hidden" }}
      >
        {def.letter && (
          <p className="label m-0 text-starlight-dim">
            <span className="bayer mr-1">{def.letter}</span> · {def.kicker}
          </p>
        )}
        <div ref={title} className={def.letter ? "mt-3" : undefined}>
          <ShimmerTitle as={isOverture ? "h1" : "h2"} size={isOverture ? "hero" : def.id === "sniff" ? "chapter" : "title"}>
            {def.title}
          </ShimmerTitle>
        </div>
        {def.subtitle && (
          <p ref={subtitle} className={cn("text-subtitle mt-3 mb-0", isOverture ? "label text-starlight-dim" : "italic text-starlight")}>
            {def.subtitle}
          </p>
        )}
        <div ref={items}>
          {def.body?.map((b) => (
            <p key={b} data-item className="text-body mt-4 mb-0 text-starlight-dim">
              {b}
            </p>
          ))}
          {children}
          {def.note && (
            <p data-item className="label mt-5 mb-0 text-starlight-dim">
              {def.note}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
