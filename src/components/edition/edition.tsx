// The Edition (`/`): overture + α–κ on the fixed stage above the one sky (PLAN §3).
// Every chapter's copy, the HUD, the index, and the scene mapping: the one place where scroll progress
// becomes scene channels for the sky (overture → hound, α → Canis Major, β → radar). Chapters with their
// own instruments render through CHAPTER_VIEWS (β is the reference, chapters/02-sniff.tsx).
import { useRef } from "react"
import { CHAPTERS, enterId, type ChapterId } from "@/content/edition"
import { band, smooth } from "@/lib/motion/math"
import { useRequestSky } from "@/lib/stage/request-sky"
import { Sniff } from "../chapters/02-sniff"
import { Spread } from "../chapters/03-spread"
import { spreadScene } from "../chapters/spread-scene"
import { Trail } from "../chapters/04-trail"
import { trailScene } from "../chapters/trail-scene"
import { Hedge } from "../chapters/05-hedge"
import { hedgeScene } from "../chapters/hedge-scene"
import { KennelChapter } from "../chapters/06-kennel"
import { kennelScene } from "../chapters/kennel-scene"
import { Embers } from "../chapters/07-embers"
import { embersScene } from "../chapters/embers-scene"
import { Sky } from "../chapters/08-sky"
import { skyScene } from "../chapters/sky-scene"
import { Den } from "../chapters/09-den"
import { denScene } from "../chapters/den-scene"
import { sniffScene } from "../chapters/sniff-scene"
import { Chapter } from "./chapter"
import { ChapterIndex } from "./chapter-index"
import { Hud } from "./hud"
import { applyLook } from "./look"
import { SymbolCarousel } from "./symbol-carousel"
import { useScrollFrame } from "./use-scroll-frame"

/** Chapters with their own instrument and labels; the rest render as a plain <Chapter>. */
const CHAPTER_VIEWS: Partial<Record<ChapterId, typeof Chapter>> = { sniff: Sniff, spread: Spread, trail: Trail, hedge: Hedge, kennel: KennelChapter, embers: Embers, sky: Sky, den: Den }

export function Edition() {
  useRequestSky("edition")
  const cue = useRef<HTMLDivElement>(null)

  // Scene channels from section progress. The crawl is whichever chapter's crawl-in is underway.
  useScrollFrame((s) => {
    const h = s.sections.overture ?? 0
    const a = s.sections.canis ?? 0
    const c = s.sections[enterId("sniff")] ?? 0
    const b = s.sections.sniff ?? 0
    const reduced = s.reduced
    const crawl = CHAPTERS.filter((ch) => ch.enter === "crawl")
      .map((ch) => s.sections[enterId(ch.id)] ?? 0)
      .find((t) => t > 0 && t < 1)
    // The scroll cue leaves with the first bit of scroll.
    const cueOut = band(h, 0.02, 0.12)
    applyLook(cue.current, { opacity: 1 - cueOut, y: cueOut * 12, blur: 0 })
    s.set({
      transition: crawl ?? 0,
      scene: {
        houndAway: reduced ? (h > 0.5 ? 1 : 0) : band(h, 0.12, 1),
        canisOn: h > 0.5 && c < 0.5 ? 1 : 0,
        canisForm: reduced ? 1 : band(a, 0, 0.42),
        canisLines: reduced ? 1 : band(a, 0.22, 0.5),
        canisLabels: reduced ? 1 : band(a, 0.38, 0.5) * (1 - band(a, 0.8, 0.95)),
        canisAway: reduced ? 0 : smooth(band(a, 0.78, 1)) * 0.6 + smooth(band(c, 0, 0.5)) * 0.4,
        flight: h * 6 + a * 10 + c * 18 + b * 10,
        // Chapters with an instrument map their own channels (β is the reference).
        ...sniffScene(s),
        ...spreadScene(s),
        ...trailScene(s),
        ...hedgeScene(s),
        ...kennelScene(s),
        ...embersScene(s),
        ...skyScene(s),
        ...denScene(s),
      },
    })
  })

  return (
    <main className="relative">
      <Hud />
      <ChapterIndex />
      <div ref={cue} className="label pointer-events-none fixed inset-x-0 bottom-16 z-10 text-center text-starlight-dim">
        <span className="intro-resolve inline-block" style={{ ["--intro-delay" as string]: 1900 }}>
          Scroll <span className="bayer ml-1">↓ α</span>
        </span>
      </div>
      <SymbolCarousel section={enterId("sniff")} />
      {CHAPTERS.map((def, i) => {
        const next = CHAPTERS[i + 1]
        const View = CHAPTER_VIEWS[def.id] ?? Chapter
        return (
          <View
            key={def.id}
            def={def}
            last={i === CHAPTERS.length - 1}
            exitInto={next?.enter === "crawl" ? enterId(next.id) : undefined}
          />
        )
      })}
    </main>
  )
}
