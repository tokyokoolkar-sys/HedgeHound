// Jump to a chapter (the α–κ rail, the phone menu). A chapter's spacer starts on an empty stage: its copy
// only arrives with the scroll. So a jump lands a little way in, where the lead copy has settled.
import type { ChapterId } from "@/content/edition"
import { scrollToTarget } from "@/lib/motion/scroll-bus"
import { EDITION } from "@/lib/stage/rhythm"

/**
 * Section progress a jump lands on: once the lead copy has fully resolved (body items finish by ~0.34;
 * a "rise" chapter once its words are in), and before a stacked layout hands over to its beat (0.47).
 */
export const landingProgress = (id: ChapterId) => {
  if (id === "overture") return 0
  const def = EDITION.find((c) => c.id === id)
  return Math.max(0.38, (def?.bodyWords?.[1] ?? def?.rise?.[1] ?? 0) + 0.04)
}

export function jumpToChapter(id: ChapterId, immediate = false) {
  const el = document.getElementById(`chapter-${id}`)
  if (!el) return
  scrollToTarget(el, { offset: el.offsetHeight * landingProgress(id), immediate })
}
