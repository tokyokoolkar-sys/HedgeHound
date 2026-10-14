// The ι den (DESIGN.md "Den orb", PLAN §3 ι). Pure: shared by the 3D orb (objects/desk-orb.tsx) and the
// "Your book" rows (chapters/09-den.tsx).
// No paper trades exist yet (Phase 0), so nothing here pretends to be a result. The den shows the owner's
// own book settings (PAPER: what is saved in this browser, or the defaults, said as such) and which live
// coins clear that bar right now. The orb's pocket sky holds exactly those coins.
import type { BookSettings } from "../scent.ts"
import { symbolHash } from "./radar.ts"

const HOURS_YEAR = 8760

export type DenInput = { symbol: string; gross_apr: number; status: string }

/**
 * Net APR at the book's own hold and round-trip cost (%), the scanner's formula:
 * gross − cost / hold × 8760. The scanner computes net at its query's defaults; the den re-amortises the
 * same gross at the book's settings.
 */
export const netForBook = (gross: number, book: Pick<BookSettings, "cost" | "hold">) => gross - (book.cost / book.hold) * HOURS_YEAR

/** Live coins that clear the book's bar: clean (alert-eligible) and net ≥ minNet at the book's hold. Loudest first. */
export function clearsBar<T extends DenInput>(rows: T[], book: BookSettings): Array<T & { net: number }> {
  return rows
    .filter((r) => r.status === "ok")
    .map((r) => ({ ...r, net: netForBook(r.gross_apr, book) }))
    .filter((r) => r.net >= book.minNet)
    .sort((a, b) => b.net - a.net)
}

/** Radius of the orb, and of the pocket sky inside it (local units). */
export const ORB_R = 2.2
export const POCKET_R = 1.6

/** A stable spot inside the pocket sky for a symbol (uniform in the ball). */
export function pocketSpot(symbol: string): [number, number, number] {
  const u = symbolHash(symbol)
  const v = symbolHash(symbol + "/v")
  const w = symbolHash(symbol + "/w")
  const theta = u * Math.PI * 2
  const phi = Math.acos(2 * v - 1)
  const r = POCKET_R * Math.cbrt(0.15 + 0.85 * w)
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)]
}

/** True when the saved book is exactly the defaults (or nothing is saved). */
export const isDefaultBook = (book: BookSettings, defaults: BookSettings) =>
  book.minNet === defaults.minNet && book.hold === defaults.hold && book.lev === defaults.lev && book.cost === defaults.cost
