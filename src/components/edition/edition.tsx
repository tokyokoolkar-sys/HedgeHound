// The Edition (`/`): overture + α–κ on the fixed stage above the one sky (PLAN §3).
// T13 builds the skeleton: every chapter's copy, the HUD, the index, and a first scene mapping for the
// overture and α (ported from D1). T14/T15 refine those chapters and add the radar, reading and carousel.
import { CHAPTERS, enterId } from "@/content/edition"
import { band, smooth } from "@/lib/motion/math"
import { useRequestSky } from "@/lib/stage/request-sky"
import { Chapter } from "./chapter"
import { ChapterIndex } from "./chapter-index"
import { Hud } from "./hud"
import { useScrollFrame } from "./use-scroll-frame"

export function Edition() {
  useRequestSky("edition")

  // Scene channels from section progress. The crawl is whichever chapter's crawl-in is underway.
  useScrollFrame((s) => {
    const h = s.sections.overture ?? 0
    const a = s.sections.canis ?? 0
    const c = s.sections[enterId("sniff")] ?? 0
    const reduced = s.reduced
    const crawl = CHAPTERS.filter((ch) => ch.enter === "crawl")
      .map((ch) => s.sections[enterId(ch.id)] ?? 0)
      .find((t) => t > 0 && t < 1)
    s.set({
      transition: crawl ?? 0,
      scene: {
        houndAway: reduced ? (h > 0.5 ? 1 : 0) : band(h, 0.12, 1),
        canisOn: h > 0.5 && c < 0.5 ? 1 : 0,
        canisForm: reduced ? 1 : band(a, 0, 0.42),
        canisLines: reduced ? 1 : band(a, 0.22, 0.5),
        canisLabels: reduced ? 1 : band(a, 0.38, 0.5) * (1 - band(a, 0.8, 0.95)),
        canisAway: reduced ? 0 : smooth(band(a, 0.78, 1)) * 0.6 + smooth(band(c, 0, 0.5)) * 0.4,
        flight: h * 6 + a * 10 + c * 18 + (s.sections.sniff ?? 0) * 10,
      },
    })
  })

  return (
    <main className="relative">
      <Hud />
      <ChapterIndex />
      {CHAPTERS.map((def, i) => {
        const next = CHAPTERS[i + 1]
        return (
          <Chapter
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
