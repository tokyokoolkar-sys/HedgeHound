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

/** The camera's resting distance from the atlas plane (SkyStage: z 10). */
export const CAM_Z = 10
/** How much "reading" magnifies the field around a focused coin. */
export const READ_ZOOM = 0.6
/** How far from the camera "fly" stops in front of the focused coin (world units). */
export const FLY_END = 2.2

/**
 * /sky's depth for a coin (world units, + toward the camera). Like the spots, it carries no meaning; it only
 * gives the field parallax when the camera travels into it.
 */
export const depthOf = (symbol: string) => (symbolHash(symbol + "/depth") * 2 - 1) * 3 - 0.5

/** The local xy multiplier that keeps a star at depth z projecting onto its flat spot from the resting camera. */
export const depthScale = (z: number) => (CAM_Z - z) / CAM_Z

export type FocusInput = {
  /** θ's pull-back zoom (1 = the whole field). */
  k0: number
  halfW: number
  halfH: number
  /** Share of the view's width on the left given to /sky's list (0 = the whole view): the field fits beside it. */
  inset: number
  /** 0..1 arrived at the coin. */
  f: number
  /** 0 = reading, 1 = fly. */
  fly: number
  /** The coin's atlas-local spot and its depth (already multiplied by atlasDepth). */
  fx: number
  fy: number
  fz: number
  /** Where the coin ends on screen, as fractions of the half-view (−1…1). */
  target: [number, number]
}

export type FocusOut = {
  scale: [number, number]
  pos: [number, number, number]
  /** The field's centre (world x at the plane); a star's local xy is placed with atlasLocal(). */
  cx: number
}

/**
 * The atlas group's transform while a coin is in focus. "reading" magnifies the field around the coin and slides
 * it to the target spot; "fly" moves the field toward the camera until the coin is FLY_END away, so nearer and
 * farther coins slide past at different rates. Either way the coin travels straight to the target, and at rest
 * every coin projects onto its flat spot whatever its depth.
 */
export function focusTransform(i: FocusInput): FocusOut {
  const { k0, halfW, halfH, f, fx, fy, fz } = i
  const cx = halfW * i.inset
  const hw = halfW * (1 - i.inset)
  const T: [number, number] = [i.target[0] * halfW, i.target[1] * halfH]
  const ms = depthScale(fz)
  const one = (fly: 0 | 1): FocusOut => {
    const k = fly ? k0 : k0 * (1 + READ_ZOOM * f)
    const gz = fly ? f * (CAM_Z - fz - FLY_END) : 0
    const dist = CAM_Z - gz - fz
    // The coin's rest offset from the group's origin (see atlasLocal).
    const rel: [number, number] = [(cx + hw * k * fx) * ms - cx, halfH * k * fy * ms]
    return {
      scale: [hw * k, halfH * k],
      pos: [cx + f * ((T[0] * dist) / CAM_Z - cx - rel[0]), f * ((T[1] * dist) / CAM_Z - rel[1]), gz],
      cx,
    }
  }
  if (i.fly <= 0) return one(0)
  const go = one(1)
  if (i.fly >= 1) return go
  const rd = one(0)
  const mix = (a: number, b: number) => a + (b - a) * i.fly
  return { scale: [mix(rd.scale[0], go.scale[0]), mix(rd.scale[1], go.scale[1])], pos: [mix(rd.pos[0], go.pos[0]), mix(rd.pos[1], go.pos[1]), mix(rd.pos[2], go.pos[2])], cx }
}

/**
 * A star's local xy for a group with scale `sx`, field centre `cx` and the star at depth z: the flat spot shrunk
 * by depthScale toward the field's centre as seen from the camera, so it projects where the flat field put it.
 */
export const atlasLocal = (x: number, y: number, z: number, sx: number, cx: number): [number, number] => {
  const m = depthScale(z)
  return [x * m + (cx / sx) * (m - 1), y * m]
}

/**
 * Where a focused coin ends on screen (fractions of the half-view): left of centre on wide screens so the
 * reading has room on its right and the list on the left stays clear; high on phones, above the docked reading.
 */
export function focusTarget(w: number, h: number): [number, number] {
  return w >= 1024 ? [-0.12, 0.12] : w >= 768 && w > h ? [-0.2, 0.1] : [0, 0.42]
}

/** Where a world point lands on the z = 0 plane as seen from the resting camera (for tests and hit-testing maths). */
export const onPlane = (p: [number, number, number]): [number, number] => [(p[0] * CAM_Z) / (CAM_Z - p[2]), (p[1] * CAM_Z) / (CAM_Z - p[2])]

/** Every atlas coin's world point and screen point (px), published by objects/atlas.tsx each frame for /sky. */
export const atlasWorld = new Map<string, Point3>()
export const atlasScreen = new Map<string, [number, number]>()

/** The atlas's transform, published by objects/atlas.tsx every frame. */
export const atlasFrame = makeFrame()

/** An atlas-local point in world space, or null while it is hidden. */
export const atlasToWorld = (x: number, y: number): Point3 | null => frameToWorld(atlasFrame, x, y)
