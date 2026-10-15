// α–κ down the left edge (DESIGN.md Layout). The active chapter's letter is lit cyan; each letter jumps
// to its chapter. Hidden under 768px. Active state is written per frame, not through React state.
import { useRef } from "react"
import { CHAPTERS, chapterOf } from "@/content/edition"
import { jumpToChapter } from "./jump"
import { useScrollFrame } from "./use-scroll-frame"

const LETTERED = CHAPTERS.filter((c) => c.letter)

export function ChapterIndex() {
  const nav = useRef<HTMLElement>(null)
  useScrollFrame((s) => {
    const active = chapterOf(s.active)
    nav.current?.querySelectorAll<HTMLElement>("[data-chapter]").forEach((a) => {
      const on = a.dataset.chapter === active
      if (a.hasAttribute("data-on") !== on) a.toggleAttribute("data-on", on)
      if (on) a.setAttribute("aria-current", "true")
      else a.removeAttribute("aria-current")
    })
  })
  return (
    <nav
      ref={nav}
      aria-label="Chapters"
      className="fixed top-1/2 left-4 z-20 hidden -translate-y-1/2 flex-col gap-2.5 md:flex"
    >
      {LETTERED.map((c) => (
        <a
          key={c.id}
          href={`#chapter-${c.id}`}
          data-chapter={c.id}
          title={c.title}
          onClick={(e) => {
            e.preventDefault()
            jumpToChapter(c.id)
          }}
          className="bayer -mx-2 -my-1 px-2 py-1 text-starlight-dim transition-[color,translate] duration-500 hover:text-starlight focus-visible:text-scan data-[on]:translate-x-1 data-[on]:text-scan"
        >
          {c.letter}
        </a>
      ))}
    </nav>
  )
}
