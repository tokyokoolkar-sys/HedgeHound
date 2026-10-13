// The Edition's chapters (PLAN §3, DESIGN.md). Copy only: no figures live here, so nothing needs a
// SourceTag. Live readings are added by the chapters themselves (T14–T27), always tagged.

export type ChapterId =
  | "overture"
  | "canis"
  | "sniff"
  | "spread"
  | "trail"
  | "hedge"
  | "kennel"
  | "embers"
  | "sky"
  | "den"
  | "ledger"

/** How the chapter's scene arrives: through a bite crawl, by rising with the scroll, or a quiet fade. */
export type Enter = "crawl" | "rise" | "fade"

export type ChapterDef = {
  id: ChapterId
  /** Greek Bayer letter for the index (α–κ); the overture has none. */
  letter: string | null
  /** Small mono kicker above the title, e.g. "Canis Major". */
  kicker?: string
  title: string
  subtitle?: string
  body?: string[]
  note?: string
  /** Scroll length of the chapter's own section (CSS length, svh). */
  length: string
  enter: Enter
  /** Scroll length of the crawl leading into it (only when enter = "crawl"). */
  enterLength?: string
  layout: "center" | "left"
  /** For left-column chapters: copy sits high (default) or low on the screen. */
  anchor?: "top" | "bottom"
  /** rise chapters: progress band over which the copy rises into place (default [0, 0.16]). */
  rise?: [number, number]
  /** rise chapters: progress band over which the title resolves from blur. */
  titleReveal?: [number, number]
  /** Progress band over which the body resolves word by word. */
  bodyWords?: [number, number]
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: "overture",
    letter: null,
    title: "HedgeHound",
    subtitle: "A funding-spread observatory · paper only",
    length: "170svh",
    enter: "fade",
    layout: "center",
  },
  {
    id: "canis",
    letter: "α",
    kicker: "Canis Major",
    title: "The hound in the sky",
    body: ["Every coin is a star. Brightness is the spread it carries; a steady light is a spread that stays."],
    note: "Positions J2000 · Bayer letters, after Ptolemy’s Almagest",
    length: "300svh",
    enter: "rise",
    layout: "left",
    anchor: "bottom",
    // D1 timing: the copy rises only after the constellation has formed (stars 0–0.42, lines 0.22–0.5).
    rise: [0.34, 0.5],
    titleReveal: [0.42, 0.52],
    bodyWords: [0.44, 0.56],
  },
  {
    id: "sniff",
    letter: "β",
    kicker: "Sniff",
    title: "Sniff",
    subtitle: "Every five minutes, the hound lifts its nose.",
    length: "330svh",
    enter: "crawl",
    enterLength: "190svh",
    layout: "left",
  },
  {
    id: "spread",
    letter: "γ",
    kicker: "The spread",
    title: "One coin. Two legs.",
    subtitle: "Long the cheap hour. Short the rich one. Price cancels.",
    length: "260svh",
    enter: "rise",
    layout: "left",
  },
  { id: "trail", letter: "δ", kicker: "The trail", title: "The Trail", subtitle: "A scent only counts if it stays.", length: "240svh", enter: "rise", layout: "left" },
  { id: "hedge", letter: "ε", kicker: "The hedge", title: "The Hedge", subtitle: "Where the hour actually disagrees.", length: "240svh", enter: "rise", layout: "left" },
  { id: "kennel", letter: "ζ", kicker: "The kennel", title: "The Kennel", subtitle: "Faster funding, worse manners.", length: "240svh", enter: "rise", layout: "left" },
  { id: "embers", letter: "η", kicker: "Cold embers", title: "Cold Embers", subtitle: "Walked past on purpose.", length: "240svh", enter: "rise", layout: "left" },
  { id: "sky", letter: "θ", kicker: "The sky", title: "The Sky", subtitle: "Every coin, charted.", length: "220svh", enter: "rise", layout: "left" },
  { id: "den", letter: "ι", kicker: "The den", title: "The Den", subtitle: "A paper desk for a small research budget.", length: "220svh", enter: "rise", layout: "left" },
  {
    id: "ledger",
    letter: "κ",
    kicker: "Ledger",
    title: "Paper only.",
    subtitle: "Not financial advice. No order code exists in Phase 0.",
    length: "160svh",
    enter: "fade",
    layout: "center",
  },
]

/** Section id for a chapter's crawl-in region. */
export const enterId = (id: ChapterId) => `${id}:enter`

/** Chapter that owns a section id (`sniff:enter` → `sniff`). */
export const chapterOf = (sectionId: string | null): ChapterId | null =>
  sectionId ? (sectionId.split(":")[0] as ChapterId) : null
