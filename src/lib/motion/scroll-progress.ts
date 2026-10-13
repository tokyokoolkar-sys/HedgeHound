// Section registry for the fixed-stage model (PLAN §4.1.5). Chapters register their scroll spacer;
// the scroll engine measures them on resize and turns the scroll position into per-section progress.
import { useCallback, useRef } from "react"
import { activeIndex, sectionProgress } from "./math.ts"

type Entry = { id: string; el: HTMLElement; top: number; height: number }

const entries: Entry[] = []

/** Re-measure every section (document coordinates). Call on resize / content change. */
export function measureSections() {
  const y = window.scrollY
  for (const e of entries) {
    const r = e.el.getBoundingClientRect()
    e.top = r.top + y
    e.height = r.height
  }
  // Keep document order so "active" is the last section entered.
  entries.sort((a, b) => a.top - b.top)
}

export function registerSection(id: string, el: HTMLElement) {
  const entry: Entry = { id, el, top: 0, height: 0 }
  entries.push(entry)
  measureSections()
  return () => {
    const i = entries.indexOf(entry)
    if (i >= 0) entries.splice(i, 1)
  }
}

/** Progress for every registered section at a scroll position, plus the active one. */
export function readSections(scrollY: number) {
  const progress = entries.map((e) => sectionProgress(scrollY, e.top, e.height))
  const i = activeIndex(progress)
  const sections: Record<string, number> = {}
  entries.forEach((e, k) => (sections[e.id] = progress[k]))
  return { sections, chapter: i, active: entries[i]?.id ?? null, progress: progress[i] ?? 0 }
}

/** Ref callback that registers an element as scroll section `id` for as long as it is mounted. */
export function useSection(id: string) {
  const off = useRef<(() => void) | null>(null)
  return useCallback(
    (el: HTMLElement | null) => {
      off.current?.()
      off.current = el ? registerSection(id, el) : null
    },
    [id],
  )
}
