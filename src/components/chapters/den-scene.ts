// ι's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band } from "@/lib/motion/math"
import { isStacked } from "@/lib/stage/layout"
import { arrival, departure, EDITION, RHYTHM } from "@/lib/stage/rhythm"
import type { Scene, StageState } from "@/lib/stage/store"

type DenChannels = Pick<Scene, "denOn" | "denAppear" | "denFocus" | "denTurn" | "denLabels" | "denAway">

/**
 * ι's scene channels. Desktop: the orb rises out of depth beside the copy and turns with the scroll through
 * the chapter; its caption arrives early and it recedes as the chapter ends. Stacked layouts take turns:
 * the orb tucked under the copy, then alone, gone before "Your book".
 */
export function denScene(s: StageState): DenChannels {
  const p = s.sections.den ?? 0
  const stacked = isStacked(document.documentElement.clientWidth, window.innerHeight)
  const rhythm = RHYTHM
  const defs = EDITION
  const arr = arrival(s.sections, defs, "den", rhythm)
  const dep = departure(s.sections, defs, "den", rhythm)
  const denOn = arr.started && (stacked ? p < 0.78 : dep.until) ? 1 : 0
  if (s.reduced) {
    const featured = !stacked || p >= 0.53 ? 1 : 0
    return { denOn, denAppear: 1, denFocus: featured, denTurn: 0, denLabels: denOn * featured, denAway: 0 }
  }
  const appear = arr.appear
  if (stacked) {
    return {
      denOn,
      denAppear: appear,
      denFocus: band(p, 0.53, 0.6),
      denTurn: p,
      denLabels: band(p, 0.6, 0.63) * (1 - band(p, 0.7, 0.73)),
      denAway: band(p, 0.73, 0.78),
    }
  }
  return {
    denOn,
    denAppear: appear,
    denFocus: 1,
    denTurn: p,
    denLabels: band(p, 0.2, 0.3) * (1 - band(p, 0.86, 0.94)),
    denAway: dep.away,
  }
}
