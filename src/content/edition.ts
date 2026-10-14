// The Edition's chapters (PLAN §3, DESIGN.md). Copy only: no readings live here, so nothing needs a
// SourceTag. Live readings are added by the chapters themselves (T14–T27), always tagged. The few
// numbers here are the scanner's own rules (β's beat), labelled as such on screen.

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
  /** Numbered steps (title + line) after the body; they stack on desktop and swap one at a time on phones. */
  steps?: Array<{ title: string; body: string }>
  /** Progress band over which the copy blurs out upward (default [0.86, 1]); earlier when a second beat follows. */
  out?: [number, number]
  /** A second copy beat that takes the first one's place (e.g. β's "What the scanner checks"). */
  beat?: Beat
  /** Title type role (default "title"; β's one-word title takes the larger "chapter" size). */
  size?: "chapter" | "title"
  /**
   * Timing on stacked (phone) layouts, where the instrument can't sit beside the copy: the first beat,
   * the instrument and the second beat take turns instead (one thing at a time).
   */
  stacked?: { out: [number, number]; beatIn: [number, number]; beatOut: [number, number] }
}

export type Beat = {
  kicker: string
  title: string
  /** Key / line pairs, shown as a quiet ruled list. */
  rows: Array<[string, string]>
  note?: string
  /** Progress band over which the rows resolve, and over which the beat leaves. */
  in: [number, number]
  out: [number, number]
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
    size: "chapter",
    subtitle: "Every five minutes, the hound lifts its nose.",
    steps: [
      {
        title: "Normalize",
        body: "Hourly equals the printed rate divided by the interval. Lighter’s public rate is eight-hour scale, so the hour is that rate divided by eight.",
      },
      { title: "Cancel", body: "Long the cheap hour, short the rich one, about the same notional. A spike hits both legs. What should remain is the spread." },
      {
        title: "Doubt",
        body: "Net APR subtracts the round trip, amortized over the hold you actually expect. A fat snapshot that dies in an hour never paid the ticket.",
      },
    ],
    // Strictly one beat at a time: the steps are gone before the rules start (no double exposure).
    out: [0.52, 0.6],
    // Every figure here is a rule in the scanner's source (WhaleHunterAlt scanner/server.py), not a reading.
    beat: {
      kicker: "The rules",
      title: "What the scanner checks",
      rows: [
        ["Poll", "Both venues, every 300 s."],
        ["Trust", "144 five-minute samples (12 hours) within the last day before a scent may alert."],
        ["Age", "Listed for 30 days or more."],
        ["Depth", "$250k of 24 h volume and $50k of open interest, on both legs."],
        ["Zero", "An exact-zero Binance rate is no signal. It is skipped."],
      ],
      note: "Thresholds from the scanner’s source · not readings",
      in: [0.62, 0.76],
      out: [0.86, 1],
    },
    // Phones: steps (to 0.53), then the radar alone with the reading (0.48–0.84), then the rules.
    stacked: { out: [0.47, 0.53], beatIn: [0.82, 0.92], beatOut: [0.96, 1] },
    length: "440svh",
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
    body: [
      "Perpetual futures settle funding between longs and shorts on a schedule. When two venues price the same coin’s funding differently, the gap between their hourly rates is the spread.",
    ],
    steps: [
      { title: "Short the rich hour", body: "Where funding is higher, you want to be short. You collect." },
      { title: "Long the cheap hour", body: "Where funding is lower, you want to be long. You pay less, or you get paid." },
      { title: "If one leg fails", body: "Flatten the other. A naked leg is just a bet the hound refused to make." },
    ],
    out: [0.52, 0.6],
    // The rows are live (the loudest scent's two legs), filled in by chapters/03-spread.tsx.
    beat: {
      kicker: "Up close",
      title: "The scent, both legs",
      rows: [],
      note: "Same coin as β’s reading · every field from the scanner",
      in: [0.62, 0.76],
      out: [0.86, 1],
    },
    stacked: { out: [0.47, 0.53], beatIn: [0.82, 0.92], beatOut: [0.96, 1] },
    length: "440svh",
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
