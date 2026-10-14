// The ζ kennel (DESIGN.md "Kennel", PLAN §3 ζ). Pure: shared by the 3D kennel (objects/kennel.tsx) and
// the labels and rows (chapters/06-kennel.tsx).
// Membership is editorial (our list of meme coins, labelled as such on screen); everything measured
// comes from the scanner: brightness = net APR, twinkle = 1 − persistence (how shaky the last 6 h were),
// and the medians that check the chapter's claim live.
import { frameToWorld, makeFrame } from "./layout.ts"
import type { Point3 } from "./projector.ts"
import { symbolHash } from "./radar.ts"

/** Radius of the kennel's enclosure (local units); the cluster sits inside it. */
export const PEN_R = 2.9

export type KennelInput = { symbol: string; net_apr: number; persistence: number; status: string }
export type KennelStar = { symbol: string; net: number; held: number; ok: boolean; x: number; y: number; sx: number; sy: number; size: number; shake: number }

/** A symbol without the exchanges' size prefix: `1000PEPE` → `PEPE`, `1000000MOG` → `MOG`, `1MBABYDOGE` → `BABYDOGE`. */
export function baseSymbol(sym: string) {
  return sym.toUpperCase().replace(/^(1000000|1000|1M)(?=[A-Z])/, "")
}

/** Is this coin on our kennel list? */
export const inKennel = (sym: string, list: readonly string[]) => list.includes(baseSymbol(sym))

/** Median of a list (null when empty). */
export function median(xs: number[]): number | null {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export type GroupStats = { n: number; held: number | null; net: number | null }

/** Medians of persistence and net APR for the kennel and for everyone else. */
export function kennelStats(rows: KennelInput[], list: readonly string[]): { kennel: GroupStats; rest: GroupStats } {
  const stats = (rs: KennelInput[]): GroupStats => ({ n: rs.length, held: median(rs.map((r) => r.persistence)), net: median(rs.map((r) => r.net_apr)) })
  return { kennel: stats(rows.filter((r) => inKennel(r.symbol, list))), rest: stats(rows.filter((r) => !inKennel(r.symbol, list))) }
}

/** Today's verdict on "faster funding, worse manners", from the medians only. */
export function verdict(k: GroupStats, r: GroupStats) {
  if (k.n === 0 || r.n === 0 || k.held == null || r.held == null || k.net == null || r.net == null) return "Not enough coins to compare today."
  const manners = k.held < r.held - 0.02 ? "Worse manners today: the kennel held less than the rest" : "Not worse today: the kennel held as well as the rest"
  const funding = k.net > r.net ? "and paid more." : "and did not pay more."
  return `${manners}, ${funding}`
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

/** The kennel coins on a sunflower spiral inside the pen (alphabetical, so the layout holds still). */
export function placeKennel(rows: KennelInput[], list: readonly string[]): KennelStar[] {
  const ks = rows.filter((r) => inKennel(r.symbol, list)).sort((a, b) => a.symbol.localeCompare(b.symbol))
  const n = ks.length
  return ks.map((r, i) => {
    const rad = (PEN_R - 0.5) * Math.sqrt((i + 0.5) / Math.max(1, n))
    const a = i * GOLDEN + symbolHash("kennel") * Math.PI * 2
    const h = symbolHash(r.symbol)
    const d = 4 + h * 3
    return {
      symbol: r.symbol,
      net: r.net_apr,
      held: r.persistence,
      ok: r.status === "ok",
      x: Math.cos(a) * rad,
      y: Math.sin(a) * rad * 0.8,
      sx: Math.cos(h * Math.PI * 2) * d,
      sy: Math.sin(h * Math.PI * 2) * d * 0.6,
      size: r.net_apr > 0 ? 6 + Math.min(1, r.net_apr / 60) * 9 : 4,
      shake: Math.min(1, Math.max(0, 1 - r.persistence)),
    }
  })
}

/** Label width and minimum vertical gap, in kennel units (symbol + net in mono). */
const LABEL_W = 2.1
const GAP_Y = 0.42

/** Which side of its star a label runs: right, unless that would leave the pen's right edge. */
export const labelSide = (k: { x: number }) => (k.x > PEN_R - 2 ? "left" : "right")

const span = (k: KennelStar): [number, number] => (labelSide(k) === "right" ? [k.x, k.x + LABEL_W] : [k.x - LABEL_W, k.x])

/** Up to `n` labelled coins, loudest first; no two label boxes overlap (side-aware). */
export function kennelLabels(stars: KennelStar[], n = 5) {
  const out: KennelStar[] = []
  for (const k of [...stars].sort((a, b) => b.net - a.net)) {
    if (out.length >= n) break
    const [a0, a1] = span(k)
    if (out.some((t) => Math.abs(t.y - k.y) < GAP_Y && a0 < span(t)[1] && span(t)[0] < a1)) continue
    out.push(k)
  }
  return out
}

/** The kennel's transform, published by objects/kennel.tsx every frame. */
export const kennelFrame = makeFrame()

/** A kennel-local point in world space, or null while it is hidden. */
export const kennelToWorld = (x: number, y: number): Point3 | null => frameToWorld(kennelFrame, x, y)
