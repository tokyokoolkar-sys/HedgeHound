// The Edition's rhythm (D2 prototype, the "rhythm round"): how chapters join. Three switches the owner
// scrolls and picks from (temporary panel on `/`), then this collapses to the chosen settings.
// - seams:    where the bite crawl runs: "rise" (only into β, as P3 shipped), "acts" (into β, ε and θ,
//             the starts of acts II–IV), "every" (into every chapter from β to ι);
// - handover: how one instrument gives way to the next inside an act: "recede" (into depth, as P3),
//             "fade" (in place, no empty sky), "travel" (in place, and the coins themselves fly across);
// - pace:     "uniform" lengths, or "varied" (δ and η shorter while their live data is thin).
// Pure apart from the small zustand store; scenes read it with getState() inside the frame.
import { create } from "zustand"
import { band, smooth } from "../motion/math.ts"
import { CHAPTERS, enterId, type ChapterDef, type ChapterId } from "../../content/edition.ts"

export type Seams = "rise" | "acts" | "every"
export type Handover = "recede" | "fade" | "travel"
export type Pace = "uniform" | "varied"
export type Rhythm = { seams: Seams; handover: Handover; pace: Pace }

/** The recommendation (what the page shows without switches). */
export const DEFAULT_RHYTHM: Rhythm = { seams: "acts", handover: "travel", pace: "varied" }

export const SEAMS: Seams[] = ["rise", "acts", "every"]
export const HANDOVERS: Handover[] = ["recede", "fade", "travel"]
export const PACES: Pace[] = ["uniform", "varied"]

/** Read the switches from a query string; anything unknown falls back to the default. */
export function parseRhythm(search: string): Rhythm {
  const q = new URLSearchParams(search)
  const pick = <T extends string>(key: string, all: T[], fallback: T) => {
    const v = q.get(key) as T | null
    return v && all.includes(v) ? v : fallback
  }
  return {
    seams: pick("seams", SEAMS, DEFAULT_RHYTHM.seams),
    handover: pick("handover", HANDOVERS, DEFAULT_RHYTHM.handover),
    pace: pick("pace", PACES, DEFAULT_RHYTHM.pace),
  }
}

/** The starts of acts II, III and IV. */
export const ACT_STARTS: ChapterId[] = ["sniff", "hedge", "sky"]
const EVERY: ChapterId[] = ["sniff", "spread", "trail", "hedge", "kennel", "embers", "sky", "den"]
/** Length of a crawl leading into a chapter (β keeps its own, longer one: it carries the carousel). */
const CRAWL_LENGTH = "150svh"

/** The chapter list for a rhythm: which chapters enter by a crawl, and how long each one runs. */
export function chaptersFor(base: ChapterDef[], r: Rhythm): ChapterDef[] {
  const crawls = r.seams === "acts" ? ACT_STARTS : r.seams === "every" ? EVERY : (["sniff"] as ChapterId[])
  return base.map((d) => {
    let out = d
    if (crawls.includes(d.id) && d.enter !== "crawl") out = { ...out, enter: "crawl", enterLength: CRAWL_LENGTH }
    if (r.pace === "varied" && (d.id === "trail" || d.id === "embers")) out = { ...out, length: "320svh" }
    return out
  })
}

type RhythmState = { rhythm: Rhythm; defs: ChapterDef[]; set: (r: Rhythm) => void }

export const useRhythm = create<RhythmState>((set) => ({
  rhythm: DEFAULT_RHYTHM,
  defs: chaptersFor(CHAPTERS, DEFAULT_RHYTHM),
  set: (rhythm) => set({ rhythm, defs: chaptersFor(CHAPTERS, rhythm) }),
}))

type Sections = Record<string, number>

const indexOf = (defs: ChapterDef[], id: ChapterId) => defs.findIndex((d) => d.id === id)

/**
 * How an instrument arrives. Through a crawl: it is there from the crawl's midpoint (when the scene swaps
 * under the bites), half grown, and settles over the start of its own section. Otherwise: from depth
 * (recede) or in place, quickly (fade / travel).
 */
export function arrival(sections: Sections, defs: ChapterDef[], id: ChapterId, r: Rhythm): { started: boolean; appear: number } {
  const p = sections[id] ?? 0
  const def = defs[indexOf(defs, id)]
  if (def?.enter === "crawl") {
    const c = sections[enterId(id)] ?? 0
    return { started: c >= 0.5 || p > 0, appear: smooth(band(c, 0.5, 1)) * 0.6 + smooth(band(p, 0, 0.2)) * 0.4 }
  }
  if (r.handover === "recede") return { started: p > 0, appear: smooth(band(p, 0.02, 0.2)) }
  return { started: p > 0, appear: smooth(band(p, 0, 0.08)) }
}

/**
 * How an instrument leaves (wide layouts; stacked ones leave before their second beat on their own).
 * Into a crawl: it holds still until the crawl's midpoint and is eaten by the bites. Otherwise: into
 * depth over the last 14% (recede), or a short fade in place at the very end (fade / travel), so the next
 * instrument arrives without an empty sky between them.
 */
export function departure(sections: Sections, defs: ChapterDef[], id: ChapterId, r: Rhythm): { until: boolean; away: number } {
  const p = sections[id] ?? 0
  const next = defs[indexOf(defs, id) + 1]
  if (next?.enter === "crawl") return { until: p < 1 || (sections[enterId(next.id)] ?? 0) < 0.5, away: 0 }
  if (r.handover === "recede") return { until: p < 1, away: band(p, 0.86, 1) }
  return { until: p < 1, away: band(p, 0.94, 1) }
}

/** Instruments fly into and out of depth only when handing over by receding. */
export const flies = (r: Rhythm) => r.handover === "recede"
