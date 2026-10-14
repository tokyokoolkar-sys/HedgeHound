// The θ atlas (DESIGN.md "Atlas", PLAN §3 θ). Pure: shared by the 3D atlas (objects/atlas.tsx) and the
// recap labels (chapters/08-sky.tsx).
// Every live coin as a star across the whole sky, each at a fixed spot from its symbol. The spots carry no
// meaning (no fake RA/Dec grid); brightness is net APR, twinkle is shakiness, orange is clean and paying.
// The recap lights each earlier chapter's key coin, using those chapters' own picks so they always agree.
import { kennelLoudest } from "./kennel.ts"
import { frameToWorld, makeFrame } from "./layout.ts"
import type { Point3 } from "./projector.ts"
import { symbolHash } from "./radar.ts"

export type AtlasInput = { symbol: string; net_apr: number; persistence: number; status: string }
export type AtlasStar = { symbol: string; net: number; ok: boolean; x: number; y: number; size: number; shake: number }

/** Spots fill this share of the view (half-width / half-height fractions), clear of the very edges. */
const SPREAD_X = 0.86
const SPREAD_Y = 0.6
/** The field sits a little high, clear of the caption under it. */
const LIFT_Y = 0.08

/** Every coin at its own stable spot, in units of the view's half-size (−1…1 on both axes). */
export function placeAtlas(rows: AtlasInput[]): AtlasStar[] {
  return rows.map((r) => ({
    symbol: r.symbol,
    net: r.net_apr,
    ok: r.status === "ok",
    x: (symbolHash(r.symbol) * 2 - 1) * SPREAD_X,
    y: (symbolHash(r.symbol + "/atlas") * 2 - 1) * SPREAD_Y + LIFT_Y,
    size: r.net_apr > 0 ? 6 + Math.min(1, r.net_apr / 60) * 12 : 4,
    shake: Math.min(1, Math.max(0, 1 - r.persistence)),
  }))
}

export type Recap = { symbol: string; letters: string[]; role: string }

/**
 * Each earlier chapter's key coin, merged by symbol (one coin can carry several letters):
 * β·γ·δ the loudest, δ the one that stayed (the steadiest), ε first on the shortlist, ζ the kennel's loudest.
 */
export function recap<T extends AtlasInput>(
  rows: T[],
  picks: { loudest: string | null; steadiest: string | null; shortlistFirst: string | null; kennel: readonly string[] },
): Recap[] {
  const order: Array<[string | null, string[], string]> = [
    [picks.loudest, ["β", "γ", "δ"], "the loudest"],
    [picks.steadiest, ["δ"], "the one that stayed"],
    [picks.shortlistFirst, ["ε"], "first on the shortlist"],
    [kennelLoudest(rows, picks.kennel)?.symbol ?? null, ["ζ"], "the kennel's loudest"],
  ]
  const out: Recap[] = []
  for (const [symbol, letters, role] of order) {
    if (!symbol || !rows.some((r) => r.symbol === symbol)) continue
    const hit = out.find((r) => r.symbol === symbol)
    if (hit) hit.letters = [...new Set([...hit.letters, ...letters])]
    else out.push({ symbol, letters: [...letters], role })
  }
  return out
}

/** The atlas's transform, published by objects/atlas.tsx every frame. */
export const atlasFrame = makeFrame()

/** An atlas-local point in world space, or null while it is hidden. */
export const atlasToWorld = (x: number, y: number): Point3 | null => frameToWorld(atlasFrame, x, y)
