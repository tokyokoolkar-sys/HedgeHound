// Which sky objects a page needs mounted (mid/low tier). The high tier mounts everything up front; phones
// and weak devices mount an object only once the reader is within a chapter of where it plays, or on the
// page that is built around it, so the boot doesn't pay for eleven instruments to show one hound.
// Pure (no three, no DOM) so it can be unit-tested under node.
import type { ChapterId } from "../../content/edition.ts"
import type { Mode } from "./store.ts"

export type SkyObject =
  | "hound"
  | "canis"
  | "radar"
  | "astrolabe"
  | "comet"
  | "field"
  | "kennel"
  | "embers"
  | "atlas"
  | "orb"
  | "travelers"

export const SKY_OBJECTS: readonly SkyObject[] = ["hound", "canis", "radar", "astrolabe", "comet", "field", "kennel", "embers", "atlas", "orb", "travelers"]

/** The Edition chapters each object plays in (including handovers into the next chapter). */
const PLAYS_IN: Record<SkyObject, readonly ChapterId[]> = {
  hound: ["overture", "canis"],
  canis: ["canis", "ledger"],
  radar: ["sniff", "spread"],
  astrolabe: ["spread", "trail"],
  comet: ["trail"],
  field: ["hedge", "kennel"],
  kennel: ["kennel"],
  embers: ["embers"],
  atlas: ["sky", "den"],
  orb: ["den"],
  // The coins carried between instruments (β→γ→δ, ε→ζ, θ→ι).
  travelers: ["sniff", "spread", "trail", "hedge", "kennel", "sky", "den"],
}

/** The working page built around an object (it needs it from the first frame). */
const PAGE_OF: Partial<Record<Mode, SkyObject>> = { sky: "atlas", den: "orb" }

/**
 * Objects needed now: on the Edition, those playing within `ahead` chapters of the active one (before it
 * scrolls in, so its shaders compile off-screen); on /sky and /den, that page's object.
 * `active` null (sections not measured yet) counts as the overture.
 */
export function neededObjects(mode: Mode, active: string | null, order: readonly ChapterId[], ahead = 1): Set<SkyObject> {
  const out = new Set<SkyObject>()
  const page = PAGE_OF[mode]
  if (page) out.add(page)
  if (mode !== "edition") return out
  const i = Math.max(0, order.indexOf((active ?? "overture") as ChapterId))
  const near = new Set(order.slice(Math.max(0, i - ahead), i + ahead + 1))
  for (const o of SKY_OBJECTS) if (PLAYS_IN[o].some((c) => near.has(c))) out.add(o)
  return out
}
