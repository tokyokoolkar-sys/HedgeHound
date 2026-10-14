// A chapter of the Edition (PLAN §4.3, fixed-stage model). It registers its scroll section(s) and puts
// its copy on a fixed layer above the sky; the copy follows the section's progress every frame.
// - enter "crawl": an extra section before it drives the bite crawl; the copy is rebuilt cell by cell.
// - enter "rise": the copy travels up from below the screen with the scroll (no effect of its own).
// - `exitInto`: the next chapter's crawl section; the copy carries on up and out while the crawl eats the sky.
import { useRef, type ReactNode } from "react"
import { cn } from "@/lib/cn"
import { band, smooth } from "@/lib/motion/math"
import { copyFrame, crawlFront, resolveIn, wordLook } from "@/lib/motion/choreo"
import { useSection } from "@/lib/motion/scroll-progress"
import { isStacked } from "@/lib/stage/layout"
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

function Spacer({ id, length, domId, children }: { id: string; length: string; domId: string; children?: ReactNode }) {
  const ref = useSection(id)
  return (
    <section ref={ref} id={domId} aria-hidden={children ? undefined : true} style={{ height: length }}>
      {children}
    </section>
  )
}

/** The chapter's copy as plain text for screen readers and reader modes (the fixed block is visual only). */
function ReaderCopy({ def }: { def: ChapterDef }) {
  return (
    <div className="sr-only">
      <h2>
        {def.letter} {def.kicker ? `${def.kicker}: ` : ""}
        {def.title}
      </h2>
      {def.subtitle && <p>{def.subtitle}</p>}
      {def.body?.map((b) => <p key={b}>{b}</p>)}
      {def.steps && (
        <ol>
          {def.steps.map((st) => (
            <li key={st.title}>
              {st.title}. {st.body}
            </li>
          ))}
        </ol>
      )}
      {def.note && <p>{def.note}</p>}
      {def.beat && def.beat.rows.length > 0 && (
        <>
          <h3>{def.beat.title}</h3>
          <dl>
            {def.beat.rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {def.beat.note && <p>{def.beat.note}</p>}
        </>
      )}
    </div>
  )
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
    // Body paragraphs, steps and the note, in reading order.
    const itemEls = items.current?.querySelectorAll<HTMLElement>("[data-item],[data-step]")
    const stacked = isStacked(document.documentElement.clientWidth, vh)
    const base = {
      vh,
      reduced: s.reduced,
      last,
      riseBand: def.rise,
      outBand: stacked && def.stacked ? def.stacked.out : def.out,
      // A following crawl carries the copy out (below), so it must not fade first and pop back (critique).
      holdOut: !!exitInto,
    }
    const f = copyFrame(p, def.enter, base)
    // Stacked layouts: the steps take turns in one place (the instrument needs the lower half); the body
    // and the note stay put.
    const swap = def.steps && stacked ? copyFrame(p, def.enter, { ...base, items: "swap", count: def.steps.length }) : null
    const lookItems = () => {
      let step = 0
      itemEls?.forEach((it, k) => applyLook(it, swap && it.hasAttribute("data-step") ? swap.item(step++) : f.item(k), false))
    }
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

    if (def.enter === "rise" && def.titleReveal) {
      applyLook(title.current, s.reduced ? resolveIn(1) : resolveIn(band(p, def.titleReveal[0], def.titleReveal[1])), false)
    }
    if (def.bodyWords) {
      const q = s.reduced ? 1 : band(p, def.bodyWords[0], def.bodyWords[1])
      items.current?.querySelectorAll<HTMLElement>("[data-words]").forEach((para) => {
        const words = para.querySelectorAll<HTMLElement>("[data-w]")
        words.forEach((w, i) => applyLook(w, wordLook(q, i, words.length), false))
      })
    }
    if (def.enter === "rise" && def.steps) lookItems()
    if (def.enter !== "rise" && !isOverture) {
      const titleT = def.enter === "crawl" ? 0.5 * band(enter, 0.8, 1) + 0.5 * band(p, 0, 0.14) : band(p, 0, 0.14)
      applyLook(title.current, s.reduced ? resolveIn(1) : resolveIn(p > 0 || enter > 0 ? titleT : 0), false)
      applyLook(subtitle.current, f.subtitle, false)
      lookItems()
    }
  })

  const position =
    def.layout === "center"
      ? cn("inset-x-0 flex flex-col items-center px-4 text-center", def.anchor === "top" ? "top-[50svh] max-md:top-[45svh]" : "bottom-[16svh]")
      : def.anchor === "bottom"
        ? "left-[max(16px,7vw)] bottom-[9svh] w-[min(500px,calc(100%_-_2*max(16px,7vw)))]"
        : "left-[max(16px,7vw)] top-[16svh] w-[min(500px,calc(100%_-_2*max(16px,7vw)))]"

  return (
    <>
      {def.enter === "crawl" && def.enterLength && <Spacer id={enterId(def.id)} domId={`chapter-${def.id}-enter`} length={def.enterLength} />}
      <Spacer id={def.id} domId={`chapter-${def.id}`} length={def.length}>
        {!isOverture && <ReaderCopy def={def} />}
      </Spacer>

      <div
        ref={block}
        className={cn("pointer-events-none fixed z-10", position)}
        aria-hidden={isOverture ? undefined : true}
        // The overture is visible on first paint (SSR, LCP = hero title); everything else waits for the scroll.
        style={{ visibility: isOverture ? "visible" : "hidden" }}
      >
        {def.letter && (
          <p className="label m-0 text-starlight-dim">
            <span className="bayer mr-1">{def.letter}</span> · {def.kicker}
          </p>
        )}
        <div ref={title} className={cn(def.letter ? "mt-3" : undefined, isOverture && "intro-resolve")}>
          <ShimmerTitle as={isOverture ? "h1" : "h2"} size={isOverture ? "hero" : (def.size ?? "title")}>
            {def.title}
          </ShimmerTitle>
        </div>
        {def.subtitle && (
          <p ref={subtitle} className={cn("mt-3 mb-0 text-balance", isOverture ? "label text-starlight-dim" : "text-subtitle italic text-starlight")}>
            {isOverture
              ? def.subtitle.split(" ").map((w, i, all) => (
                  <span key={i} className="intro-resolve inline-block whitespace-pre" style={{ ["--intro-delay" as string]: 700 + i * 120 }}>
                    {w}
                    {i < all.length - 1 ? " " : ""}
                  </span>
                ))
              : def.subtitle}
          </p>
        )}
        <div ref={items}>
          {def.body?.map((b) =>
            def.bodyWords ? (
              <p key={b} data-words aria-label={b} className="text-body mt-4 mb-0 text-starlight-dim">
                {b.split(" ").map((w, i, all) => (
                  <span key={i} data-w aria-hidden="true" className="inline-block whitespace-pre">
                    {w}
                    {i < all.length - 1 ? " " : ""}
                  </span>
                ))}
              </p>
            ) : (
              <p key={b} data-item className="text-body mt-4 mb-0 text-starlight-dim">
                {b}
              </p>
            ),
          )}
          {def.steps && (
            <ol className="m-0 mt-6 grid list-none gap-5 p-0 max-md:gap-0 max-md:*:[grid-area:1/1]">
              {def.steps.map((st, i) => (
                <li key={st.title} data-step className="grid grid-cols-[2rem_1fr] items-baseline">
                  <span className="label text-starlight-dim">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="m-0 font-light-display text-subtitle text-starlight">{st.title}</h3>
                    <p className="text-body mt-1 mb-0 text-starlight-dim">{st.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
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
