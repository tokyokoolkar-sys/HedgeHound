// The η ember field (DESIGN.md "Cold embers", PLAN §3 η). Pure: shared by the 3D embers
// (objects/ember-field.tsx) and the labels and rows (chapters/07-embers.tsx).
// One ember per coin the scanner skipped on purpose (`meta.skipped_*`), nothing decorative. Three loose
// streams, one per reason; they fall with the scroll and cool from warm starlight to chart-line grey.
// Each stream draws at most `cap` embers and says how many more there are, so the count stays true.
import { frameToWorld, makeFrame } from "./layout.ts"
import type { Point3 } from "./projector.ts"
import { symbolHash } from "./radar.ts"

export type Reason = "zero" | "young" | "thin"
export const REASONS: Reason[] = ["zero", "young", "thin"]
/** Short stream titles (they must fit three across a phone). */
export const REASON_TITLE: Record<Reason, string> = { zero: "zero", young: "young", thin: "thin" }
/** Stream centres across the field (local units). */
export const STREAM_X: Record<Reason, number> = { zero: -2.5, young: 0, thin: 2.5 }
export const TOP_Y = 1.6
export const FALL = 1.4
export const EMBER_CAP = 14

export type Skipped = { skipped_zero?: string[]; skipped_young?: string[]; skipped_thin?: string[] }
export type Ember = { symbol: string; note: string | null; reason: Reason; x: number; y0: number; speed: number; drift: number }

/** The scanner tags some young coins as `XYZ(status=SETTLING)`: a coin that isn't trading. */
export function cleanSymbol(raw: string): { symbol: string; note: string | null } {
  const m = raw.match(/^(.+?)\(status=([^)]*)\)$/)
  return m ? { symbol: m[1], note: "not trading" } : { symbol: raw, note: null }
}

/** The lists by reason, cleaned. */
export function skippedLists(meta: Skipped | undefined): Record<Reason, Array<{ symbol: string; note: string | null }>> {
  return {
    zero: (meta?.skipped_zero ?? []).map(cleanSymbol),
    young: (meta?.skipped_young ?? []).map(cleanSymbol),
    thin: (meta?.skipped_thin ?? []).map(cleanSymbol),
  }
}

/** How many a stream doesn't draw. */
export const moreThan = (n: number, cap: number) => Math.max(0, n - cap)

/** Embers for every reason, at most `cap` each, spread down the top of their stream. */
export function placeEmbers(meta: Skipped | undefined, cap = EMBER_CAP): Ember[] {
  const lists = skippedLists(meta)
  const out: Ember[] = []
  for (const reason of REASONS) {
    const shown = lists[reason].slice(0, cap)
    shown.forEach((c, i) => {
      const h = symbolHash(c.symbol)
      const h2 = symbolHash(c.symbol + "·")
      out.push({
        ...c,
        reason,
        x: STREAM_X[reason] + (h - 0.5) * 1.3,
        y0: TOP_Y - 0.3 - (i / Math.max(1, cap)) * 2.6,
        speed: 0.65 + h2 * 0.7,
        drift: (h2 - 0.5) * 0.4,
      })
    })
  }
  return out
}

/** An ember's position and how cooled it is (0 warm … 1 cold) for fall progress 0..1. */
export function emberAt(e: Ember, fall: number): { x: number; y: number; cool: number } {
  const f = Math.min(1, Math.max(0, fall)) * e.speed
  return { x: e.x + e.drift * f, y: e.y0 - FALL * f, cool: Math.min(1, f / 1.2) }
}

/** The field's transform, published by objects/ember-field.tsx every frame. */
export const emberFrame = makeFrame()

/** A field-local point in world space, or null while it is hidden. */
export const emberToWorld = (x: number, y: number): Point3 | null => frameToWorld(emberFrame, x, y)
