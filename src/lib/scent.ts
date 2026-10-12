/**
 * Field sample shaped like the local scanner. Not a live poll.
 *
 * Split (T40):
 *  - LAYOUT: sector, 3D position and blurb per coin, plus LINKS (art direction).
 *  - SAMPLE: static figures. `allRows()`, `boardRows()`, `trailFor()`, `CLOSED`, `REBALANCE`
 *    and `OPEN_SEED` are all derived from or part of the sample and are SAMPLE data.
 *    `trailFor()` synthesizes its points from a seeded RNG; it never reads a measurement.
 *  - Live data lives in `src/lib/scan`.
 */

export const HOURS_YEAR = 8760
export const MIN_VOL = 250_000
export const MIN_OI = 50_000
export const CAPITAL = 20
export const KILL_LOSS = CAPITAL * 0.25
export const SETTINGS_KEY = "hedgehound.book"
export const WATCH_KEY = "hedgehound.watch"

export type Venue = "Lighter" | "Binance"
export type Sector = "canis" | "hedge" | "kennel" | "embers"
export type Status = "ok" | "building history" | "filtered"

export type BookSettings = {
  minNet: number
  hold: number
  lev: number
  cost: number
}

export const DEFAULT_BOOK: BookSettings = {
  minNet: 15,
  hold: 72,
  lev: 2,
  cost: 0.3,
}

export type Star = {
  symbol: string
  sector: Sector
  lighterHr: number
  binanceHr: number
  status: Status
  filterReason?: string
  n24: number
  hoursSinceFlip: number
  windowH: number
  /** Chance a trail point keeps the current sign. */
  calm: number
  volL: number
  volB: number
  oiL: number
  oiB: number
  stale: boolean
  pos: [number, number, number]
  blurb: string
}

/** Layout half of a Star: art direction only. */
export type Layout = Pick<Star, "sector" | "pos" | "blurb">
/** Figures half of a Star: static sample numbers. */
export type SampleFigures = Omit<Star, keyof Layout>

export const SECTORS: Record<Sector, { name: string; line: string }> = {
  canis: {
    name: "Canis",
    line: "The hound. Deep books, small disagreements. The shape of the mark, not usually the trade.",
  },
  hedge: {
    name: "The Hedge",
    line: "Where the hour actually disagrees, and both legs still have a book.",
  },
  kennel: {
    name: "The Kennel",
    line: "Memes. Faster funding, worse manners. Persistence has to earn the alert.",
  },
  embers: {
    name: "Cold embers",
    line: "Walked past on purpose. A zero rate, a young listing, or a thin book.",
  },
}

/**
 * Why a coin is a cold ember, by scanner list (`meta.skipped_*`). One string per list,
 * shared by the SAMPLE embers below and by `lib/scan/adapter.ts` for live embers.
 */
export type EmberList = "zero" | "young" | "thin"
export const EMBER_REASONS: Record<EmberList, string> = {
  zero: "Binance printed an exact-zero funding rate. That is no signal — it used to fake four-digit APRs.",
  young: "Less than 30 days since Binance onboarded it. The risk rule skips new listings.",
  thin: "Both legs must clear $250k of 24h volume and $50k of open interest. This one does not.",
}

/**
 * LAYOUT MAP: where each coin sits in the sky and what it says. Art direction, not data.
 * Nothing here is a measurement. Live figures come from `lib/scan` (LIVE); everything in
 * `SAMPLE` below is a static field sample and must be shown with a SAMPLE tag.
 */
export const LAYOUT: Record<string, Layout> = {
  SOL: { sector: "canis", pos: [0.55, 1.28, 0.2], blurb: "Ear of the hound. The sample is still short of a day." },
  ETH: { sector: "canis", pos: [0.95, 0.68, 0.05], blurb: "Crown. A modest gap, and the tape is still filling in." },
  BTC: { sector: "canis", pos: [1.95, 0.32, 0.12], blurb: "The nose. Deepest book, smallest argument between the hours." },
  BNB: { sector: "canis", pos: [0.72, 0.02, -0.06], blurb: "Throat. Too few polls to trust the average." },
  AVAX: { sector: "canis", pos: [-0.15, -0.28, 0.1], blurb: "Shoulder. Real pair, small gap." },
  LINK: { sector: "canis", pos: [-1.05, 0.18, 0], blurb: "Haunch. Binance is the richer hour." },
  DOGE: { sector: "canis", pos: [-1.95, 0.82, 0.22], blurb: "Tail. Familiar coin, thin spread after the ticket." },
  TIA: { sector: "hedge", pos: [-2.15, 1.2, -0.35], blurb: "Lighter's hour is richer. Close to the bar, not over it at 72h." },
  ARB: { sector: "hedge", pos: [-3.05, 1.32, -1.05], blurb: "The loudest clean scent in this sample." },
  NEAR: { sector: "hedge", pos: [-4.2, 0.82, -1.55], blurb: "Same direction as ARB, a smaller gap." },
  OP: { sector: "hedge", pos: [-3.65, 0.12, -1.15], blurb: "Sign is steady. The round trip still eats the edge at a long hold." },
  SEI: { sector: "hedge", pos: [-4.35, -0.55, -1.65], blurb: "Binance is the rich hour. The short belongs there if the net clears." },
  SUI: { sector: "hedge", pos: [-3.1, -0.88, -0.65], blurb: "Flipped the other way from ARB. Lighter is the cheap hour." },
  INJ: { sector: "hedge", pos: [-2.65, -1.55, -1.05], blurb: "Under the house bar unless you shorten the hold or the cost." },
  APT: { sector: "hedge", pos: [-2.25, -0.28, -0.25], blurb: "Visible gap. Not payable at the default 72 hour hold." },
  FLOKI: { sector: "kennel", pos: [3.05, 2.15, 1.25], blurb: "Kennel dust. The sign wanders." },
  BONK: { sector: "kennel", pos: [3.55, 1.5, 1.45], blurb: "Big print, shaky persistence. Not a scent until it sits still." },
  WIF: { sector: "kennel", pos: [2.65, 1.42, 0.85], blurb: "The kennel name that actually sat still." },
  "1000PEPE": { sector: "kennel", pos: [3.35, 0.78, 1.15], blurb: "The widest gap and the worst manners. It flipped within the hour." },
  "1000SHIB": { sector: "kennel", pos: [2.4, 0.62, 0.65], blurb: "Mapped with the 1000 prefix, same coin on both venues." },
  BOT: { sector: "embers", pos: [-0.35, -2.25, -3.2], blurb: "Cold on purpose." },
  H100: { sector: "embers", pos: [-1.7, -2.65, -2.7], blurb: "Too young to hedge." },
  DUST: { sector: "embers", pos: [1.45, -2.5, -3.5], blurb: "Thin book. A hedge you cannot get out of is not a hedge." },
}

/**
 * SAMPLE rows: a static field sample, shaped like the scanner but NOT a poll.
 * Every figure here (hourly rates, volume, open interest, n24, flip hours) is SAMPLE.
 */
export const SAMPLE: SampleFigures[] = [
  { symbol: "SOL", lighterHr: 0.00007, binanceHr: 0.000026, status: "building history", n24: 110, hoursSinceFlip: 9.2, windowH: 8.4, calm: 0.9, volL: 42e6, volB: 180e6, oiL: 8e6, oiB: 22e6, stale: false },
  { symbol: "ETH", lighterHr: 0.000041, binanceHr: 0.00001, status: "building history", n24: 86, hoursSinceFlip: 6.4, windowH: 6.8, calm: 0.92, volL: 80e6, volB: 900e6, oiL: 20e6, oiB: 80e6, stale: false },
  { symbol: "BTC", lighterHr: 0.00001, binanceHr: 0.000028, status: "building history", n24: 48, hoursSinceFlip: 4.1, windowH: 3.6, calm: 0.94, volL: 120e6, volB: 2.4e9, oiL: 40e6, oiB: 200e6, stale: false },
  { symbol: "BNB", lighterHr: 0.00002, binanceHr: 0.000008, status: "building history", n24: 22, hoursSinceFlip: 2.2, windowH: 1.6, calm: 0.88, volL: 6e6, volB: 40e6, oiL: 2e6, oiB: 9e6, stale: false },
  { symbol: "AVAX", lighterHr: 0.000062, binanceHr: 0.000012, status: "ok", n24: 168, hoursSinceFlip: 15.5, windowH: 22.4, calm: 0.93, volL: 4e6, volB: 28e6, oiL: 1.2e6, oiB: 6e6, stale: false },
  { symbol: "LINK", lighterHr: 0.000021, binanceHr: 0.000065, status: "ok", n24: 172, hoursSinceFlip: 20.1, windowH: 23.2, calm: 0.91, volL: 5e6, volB: 36e6, oiL: 1.5e6, oiB: 8e6, stale: false },
  { symbol: "DOGE", lighterHr: 0.000055, binanceHr: 0.000015, status: "ok", n24: 180, hoursSinceFlip: 11.4, windowH: 23.6, calm: 0.9, volL: 9e6, volB: 70e6, oiL: 2e6, oiB: 12e6, stale: false },
  { symbol: "TIA", lighterHr: 0.00007, binanceHr: 0.000016, status: "ok", n24: 166, hoursSinceFlip: 13.2, windowH: 22.8, calm: 0.9, volL: 3e6, volB: 18e6, oiL: 0.8e6, oiB: 4e6, stale: false },
  { symbol: "ARB", lighterHr: 0.000098, binanceHr: 0.000016, status: "ok", n24: 188, hoursSinceFlip: 28.4, windowH: 23.8, calm: 0.98, volL: 8e6, volB: 42e6, oiL: 2.4e6, oiB: 11e6, stale: false },
  { symbol: "NEAR", lighterHr: 0.000068, binanceHr: 0.00002, status: "ok", n24: 160, hoursSinceFlip: 10.6, windowH: 22.1, calm: 0.88, volL: 2.2e6, volB: 14e6, oiL: 0.6e6, oiB: 3e6, stale: false },
  { symbol: "OP", lighterHr: 0.000066, binanceHr: 0.000016, status: "ok", n24: 174, hoursSinceFlip: 17.8, windowH: 23.1, calm: 0.92, volL: 3.4e6, volB: 16e6, oiL: 0.9e6, oiB: 4.4e6, stale: false },
  { symbol: "SEI", lighterHr: 0.00002, binanceHr: 0.000082, status: "ok", n24: 170, hoursSinceFlip: 14.2, windowH: 22.6, calm: 0.97, volL: 2.8e6, volB: 15e6, oiL: 0.7e6, oiB: 3.6e6, stale: false },
  { symbol: "SUI", lighterHr: 0.000018, binanceHr: 0.000092, status: "ok", n24: 192, hoursSinceFlip: 21.6, windowH: 23.9, calm: 0.98, volL: 7e6, volB: 38e6, oiL: 1.8e6, oiB: 9e6, stale: false },
  { symbol: "INJ", lighterHr: 0.000019, binanceHr: 0.000073, status: "ok", n24: 158, hoursSinceFlip: 8.8, windowH: 21.4, calm: 0.86, volL: 1.6e6, volB: 11e6, oiL: 0.4e6, oiB: 2.2e6, stale: false },
  { symbol: "APT", lighterHr: 0.000064, binanceHr: 0.000014, status: "ok", n24: 164, hoursSinceFlip: 12.4, windowH: 22.2, calm: 0.9, volL: 2e6, volB: 12e6, oiL: 0.5e6, oiB: 2.8e6, stale: false },
  { symbol: "FLOKI", lighterHr: 0.00005, binanceHr: 0.000017, status: "ok", n24: 150, hoursSinceFlip: 6.2, windowH: 20.4, calm: 0.8, volL: 1.1e6, volB: 8e6, oiL: 0.2e6, oiB: 1.4e6, stale: false },
  { symbol: "BONK", lighterHr: 0.000078, binanceHr: 0.00003, status: "ok", n24: 155, hoursSinceFlip: 5.4, windowH: 20.8, calm: 0.62, volL: 1.4e6, volB: 9e6, oiL: 0.25e6, oiB: 1.6e6, stale: false },
  { symbol: "WIF", lighterHr: 0.00009, binanceHr: 0.000022, status: "ok", n24: 176, hoursSinceFlip: 16.8, windowH: 23.4, calm: 0.97, volL: 3e6, volB: 20e6, oiL: 0.7e6, oiB: 4e6, stale: false },
  { symbol: "1000PEPE", lighterHr: 0.00012, binanceHr: 0.000025, status: "ok", n24: 184, hoursSinceFlip: 1.4, windowH: 23.5, calm: 0.42, volL: 6e6, volB: 40e6, oiL: 1.1e6, oiB: 7e6, stale: false },
  { symbol: "1000SHIB", lighterHr: 0.00006, binanceHr: 0.000018, status: "ok", n24: 162, hoursSinceFlip: 7.6, windowH: 21.8, calm: 0.84, volL: 1.8e6, volB: 12e6, oiL: 0.4e6, oiB: 2.4e6, stale: false },
  { symbol: "BOT", lighterHr: 0.00042, binanceHr: 0, status: "filtered", filterReason: EMBER_REASONS.zero, n24: 0, hoursSinceFlip: 0, windowH: 0, calm: 1, volL: 0.2e6, volB: 1e6, oiL: 40_000, oiB: 80_000, stale: false },
  { symbol: "H100", lighterHr: 0.0002, binanceHr: 0.00004, status: "filtered", filterReason: EMBER_REASONS.young, n24: 0, hoursSinceFlip: 0, windowH: 0, calm: 1, volL: 0.8e6, volB: 2e6, oiL: 0.2e6, oiB: 0.4e6, stale: false },
  { symbol: "DUST", lighterHr: 0.00015, binanceHr: 0.00001, status: "filtered", filterReason: EMBER_REASONS.thin, n24: 0, hoursSinceFlip: 0, windowH: 0, calm: 1, volL: 40_000, volB: 90_000, oiL: 8_000, oiB: 20_000, stale: false },
]

/** SAMPLE figures merged with their layout, in one record per coin. Still SAMPLE data. */
export const STARS: Star[] = SAMPLE.map((figures) => {
  const layout = LAYOUT[figures.symbol]
  if (!layout) throw new Error(`No layout for sample symbol ${figures.symbol}`)
  return { ...figures, ...layout }
})

export const LINKS: Array<[string, string]> = [
  ["SOL", "ETH"],
  ["ETH", "BTC"],
  ["BTC", "BNB"],
  ["ETH", "BNB"],
  ["BNB", "AVAX"],
  ["AVAX", "LINK"],
  ["LINK", "DOGE"],
  ["TIA", "ARB"],
  ["ARB", "OP"],
  ["OP", "SUI"],
  ["SUI", "APT"],
  ["ARB", "NEAR"],
  ["NEAR", "SEI"],
  ["SUI", "INJ"],
  ["FLOKI", "BONK"],
  ["BONK", "1000PEPE"],
  ["1000PEPE", "1000SHIB"],
  ["1000SHIB", "WIF"],
  ["WIF", "FLOKI"],
  ["WIF", "BONK"],
]

export type Focus =
  | { type: "star"; symbol: string }
  | { type: "sector"; sector: Sector }
  | null

export type Row = {
  symbol: string
  sector: Sector
  status: Status
  filterReason?: string
  lighterHr: number
  binanceHr: number
  spreadHr: number
  grossApr: number
  netApr: number
  signedApr: number
  lighterApr: number
  binanceApr: number
  persistence: number
  long: Venue
  short: Venue
  liqDist: number
  hoursSinceFlip: number
  windowH: number
  n24: number
  stale: boolean
  volL: number
  volB: number
  oiL: number
  oiB: number
  note: string
  blurb: string
  pos: [number, number, number]
  alert: boolean
  trail: number[]
  breakEvenH: number
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function dragPoints(cost: number, hold: number) {
  if (hold <= 0) return 0
  return (cost / hold) * HOURS_YEAR
}

export function aprFromHourly(hr: number) {
  return hr * HOURS_YEAR * 100
}

export function breakEvenHours(grossApr: number, cost: number) {
  if (grossApr <= 0) return Number.POSITIVE_INFINITY
  return (cost * HOURS_YEAR) / grossApr
}

export function trailFor(star: Star, n = 24): number[] {
  const rand = mulberry32(hash(star.symbol))
  const spread = star.lighterHr - star.binanceHr
  const mag = Math.max(Math.abs(spread), 1e-8)
  const sign = Math.sign(spread) || 1
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const keep = rand() < star.calm
    const s = keep ? sign : -sign
    const wobble = (rand() - 0.5) * mag * 0.22
    out.push(aprFromHourly(s * mag + wobble))
  }
  out[n - 1] = aprFromHourly(sign * mag)
  return out
}

function persistenceOf(trail: number[], minNet: number) {
  if (!trail.length) return 0
  const last = trail[trail.length - 1] ?? 0
  let hit = 0
  for (const x of trail) {
    if (x * last > 0 && Math.abs(x) >= minNet) hit++
  }
  return hit / trail.length
}

export function describe(row: Pick<Row, "status" | "filterReason" | "n24" | "stale" | "alert" | "netApr" | "persistence" | "hoursSinceFlip" | "breakEvenH" | "grossApr">, book: BookSettings) {
  if (row.status === "filtered") return row.filterReason ?? "Filtered."
  if (row.status === "building history") {
    return `${row.n24} of 144 samples in the trailing day. Snapshot only — not eligible to alert.`
  }
  if (row.stale) return "Binance next funding time is older than a full interval."
  if (row.alert) {
    const be = Number.isFinite(row.breakEvenH) ? `${row.breakEvenH.toFixed(0)}h` : "—"
    return `Clears the bar. Net ${row.netApr.toFixed(1)}%, persistence ${(row.persistence * 100).toFixed(0)}%, ${row.hoursSinceFlip}h since the sign flipped. About ${be} to earn back the round trip, before any transfer.`
  }
  if (row.persistence < 0.5) {
    return `The print has not sat still. Persistence is ${(row.persistence * 100).toFixed(0)}% of this field sample. Not an alert.`
  }
  return `The sign is steady, but net ${row.netApr.toFixed(1)}% is under your ${book.minNet}% bar once the round trip is amortized.`
}

export function allRows(book: BookSettings = DEFAULT_BOOK): Row[] {
  return STARS.map((star) => {
    const spreadHr = star.lighterHr - star.binanceHr
    const grossApr = Math.abs(aprFromHourly(spreadHr))
    const netApr = grossApr - dragPoints(book.cost, book.hold)
    const trail = trailFor(star)
    const persistence = star.status === "filtered" ? 0 : persistenceOf(trail, book.minNet)
    const long: Venue = spreadHr > 0 ? "Binance" : "Lighter"
    const short: Venue = spreadHr > 0 ? "Lighter" : "Binance"
    const alert =
      star.status === "ok" && netApr >= book.minNet && persistence >= 0.5 && !star.stale
    const row: Row = {
      symbol: star.symbol,
      sector: star.sector,
      status: star.status,
      filterReason: star.filterReason,
      lighterHr: star.lighterHr,
      binanceHr: star.binanceHr,
      spreadHr,
      grossApr,
      netApr,
      signedApr: aprFromHourly(spreadHr),
      lighterApr: aprFromHourly(star.lighterHr),
      binanceApr: aprFromHourly(star.binanceHr),
      persistence,
      long,
      short,
      liqDist: 100 / book.lev - 0.5,
      hoursSinceFlip: star.hoursSinceFlip,
      windowH: star.windowH,
      n24: star.n24,
      stale: star.stale,
      volL: star.volL,
      volB: star.volB,
      oiL: star.oiL,
      oiB: star.oiB,
      note: "",
      blurb: star.blurb,
      pos: star.pos,
      alert,
      trail,
      breakEvenH: breakEvenHours(grossApr, book.cost),
    }
    row.note = describe(row, book)
    return row
  })
}

export function boardRows(book: BookSettings = DEFAULT_BOOK) {
  return allRows(book)
    .filter((r) => r.status !== "filtered")
    .filter((r) => r.status === "building history" || r.netApr >= book.minNet)
    .sort((a, b) => {
      if (a.alert !== b.alert) return a.alert ? -1 : 1
      const rank = (r: Row) => (r.status === "ok" ? 0 : 1)
      if (rank(a) !== rank(b)) return rank(a) - rank(b)
      return b.netApr - a.netApr
    })
}

export function starBySymbol(symbol: string) {
  return STARS.find((s) => s.symbol === symbol)
}

function clamp(n: unknown, lo: number, hi: number, fallback: number) {
  const x = typeof n === "number" ? n : Number(n)
  if (!Number.isFinite(x)) return fallback
  return Math.min(hi, Math.max(lo, x))
}

export function readBook(): BookSettings {
  if (typeof localStorage === "undefined") return DEFAULT_BOOK
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_BOOK
    const p = JSON.parse(raw) as Partial<BookSettings>
    return {
      minNet: clamp(p.minNet, 0, 80, DEFAULT_BOOK.minNet),
      hold: clamp(p.hold, 8, 336, DEFAULT_BOOK.hold),
      lev: clamp(p.lev, 1, 2, DEFAULT_BOOK.lev),
      cost: clamp(p.cost, 0.05, 0.8, DEFAULT_BOOK.cost),
    }
  } catch {
    return DEFAULT_BOOK
  }
}

export function writeBook(book: BookSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(book))
}

export function readWatch(): string[] {
  if (typeof localStorage === "undefined") return []
  try {
    const raw = localStorage.getItem(WATCH_KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(list)) return []
    return list.filter((x) => typeof x === "string")
  } catch {
    return []
  }
}

export function writeWatch(list: string[]) {
  localStorage.setItem(WATCH_KEY, JSON.stringify(list))
}

export type ClosedTrade = {
  symbol: string
  hours: number
  long: Venue
  short: Venue
  funding: number
  expected: number
  pricePnl: number
  variable: number
  exit: string
  adverse: number
}

/** SAMPLE: fabricated closed trades. Not the owner's paper book. */
export const CLOSED: ClosedTrade[] = [
  { symbol: "WIF", hours: 54, long: "Binance", short: "Lighter", funding: 0.074, expected: 0.11, pricePnl: 0.012, variable: 0.06, exit: "Net fell under half the entry", adverse: 4.2 },
  { symbol: "OP", hours: 41, long: "Binance", short: "Lighter", funding: 0.041, expected: 0.07, pricePnl: -0.018, variable: 0.06, exit: "Sign flipped and held 3 hours", adverse: 9.1 },
  { symbol: "TIA", hours: 80, long: "Binance", short: "Lighter", funding: 0.088, expected: 0.1, pricePnl: 0.006, variable: 0.06, exit: "Spread cooled under the bar", adverse: 3.4 },
  { symbol: "SEI", hours: 36, long: "Lighter", short: "Binance", funding: 0.052, expected: 0.09, pricePnl: -0.033, variable: 0.06, exit: "Mark moved hard — early warning, not a liquidation", adverse: 14.0 },
  { symbol: "INJ", hours: 62, long: "Lighter", short: "Binance", funding: 0.066, expected: 0.08, pricePnl: 0.015, variable: 0.06, exit: "Net fell under half the entry", adverse: 6.2 },
  { symbol: "NEAR", hours: 28, long: "Binance", short: "Lighter", funding: 0.031, expected: 0.06, pricePnl: -0.009, variable: 0.06, exit: "Sign flipped and held 3 hours", adverse: 8.4 },
]

/** SAMPLE: fabricated rebalance log. */
export const REBALANCE = [
  { when: "12 Oct · 02:10", amount: 8, cost: 1, reason: "Top up the short leg" },
]

/** SAMPLE: fabricated open positions. */
export const OPEN_SEED = [
  {
    symbol: "ARB",
    settledHours: 18,
    long: "Binance" as Venue,
    short: "Lighter" as Venue,
    spreadHr: 0.000082,
    pricePnl: -0.012,
    notional: 20,
    watch: "Still above half the entry spread. Forced review at 7 days.",
  },
  {
    symbol: "SUI",
    settledHours: 9,
    long: "Lighter" as Venue,
    short: "Binance" as Venue,
    spreadHr: -0.000074,
    pricePnl: 0.008,
    notional: 20,
    watch: "No sign flip. Mark still inside the 20% early-warning band.",
  },
]

export const ENTRY_COST_PCT = 0.0015

export function openFunding(spreadHr: number, notional: number, settledHours: number) {
  return Math.abs(spreadHr) * notional * settledHours
}

export function closedStats() {
  const nets = CLOSED.map((t) => t.funding + t.pricePnl - t.variable)
  const total = nets.reduce((a, b) => a + b, 0)
  const wins = nets.filter((n) => n > 0).length
  const avgHold = CLOSED.reduce((a, t) => a + t.hours, 0) / CLOSED.length
  const ratios = CLOSED.map((t) => t.funding / t.expected).sort((a, b) => a - b)
  const mid = ratios.length / 2
  const medianRatio =
    ratios.length % 2 === 0
      ? ((ratios[mid - 1] ?? 0) + (ratios[mid] ?? 0)) / 2
      : (ratios[Math.floor(mid)] ?? 0)
  const fixed = REBALANCE.reduce((a, r) => a + r.cost, 0)
  const worst = Math.max(...CLOSED.map((t) => t.adverse))
  return {
    nets,
    total,
    wins,
    n: CLOSED.length,
    avgHold,
    medianRatio,
    ratioLo: ratios[0] ?? 0,
    ratioHi: ratios[ratios.length - 1] ?? 0,
    worst,
    fixed,
    afterFixed: total - fixed,
  }
}

export function money(n: number, digits = 2) {
  const sign = n < 0 ? "−" : ""
  return `${sign}$${Math.abs(n).toFixed(digits)}`
}

export function usdCompact(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}k`
  return `$${n.toFixed(0)}`
}
