// ι's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band, smooth } from "@/lib/motion/math"
import { isStacked } from "@/lib/stage/layout"
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
  const denOn = p > 0 && p < (stacked ? 0.82 : 1) ? 1 : 0
  if (s.reduced) {
    const featured = !stacked || p >= 0.5 ? 1 : 0
    return { denOn, denAppear: 1, denFocus: featured, denTurn: 0, denLabels: denOn * featured, denAway: 0 }
  }
  const appear = smooth(band(p, 0.02, 0.2))
  if (stacked) {
    return {
      denOn,
      denAppear: appear,
      denFocus: band(p, 0.48, 0.56),
      denTurn: p,
      denLabels: band(p, 0.56, 0.62) * (1 - band(p, 0.75, 0.78)),
      denAway: band(p, 0.77, 0.82),
    }
  }
  return {
    denOn,
    denAppear: appear,
    denFocus: 1,
    denTurn: p,
    denLabels: band(p, 0.2, 0.3) * (1 - band(p, 0.86, 0.94)),
    denAway: band(p, 0.86, 1),
  }
}
