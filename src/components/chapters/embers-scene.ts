// η's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band, smooth } from "@/lib/motion/math"
import { isStacked } from "@/lib/stage/layout"
import type { Scene, StageState } from "@/lib/stage/store"

type EmberChannels = Pick<Scene, "emberOn" | "emberAppear" | "emberFocus" | "emberFall" | "emberLabels" | "emberAway">

/**
 * η's scene channels. Desktop: the streams rise out of depth beside the copy, the embers fall with the
 * scroll through most of the chapter (0.1–0.86), the labels arrive early; it recedes as the chapter ends.
 * Stacked layouts take turns: embers tucked under the copy, then the field alone, gone before the lists.
 */
export function embersScene(s: StageState): EmberChannels {
  const p = s.sections.embers ?? 0
  const stacked = isStacked(document.documentElement.clientWidth, window.innerHeight)
  const emberOn = p > 0 && p < (stacked ? 0.82 : 1) ? 1 : 0
  if (s.reduced) {
    const featured = !stacked || p >= 0.5 ? 1 : 0
    return { emberOn, emberAppear: 1, emberFocus: featured, emberFall: 0, emberLabels: emberOn * featured, emberAway: 0 }
  }
  const appear = smooth(band(p, 0.02, 0.2))
  if (stacked) {
    return {
      emberOn,
      emberAppear: appear,
      emberFocus: band(p, 0.48, 0.56),
      emberFall: band(p, 0.5, 0.8),
      emberLabels: band(p, 0.56, 0.6) * (1 - band(p, 0.75, 0.78)),
      emberAway: band(p, 0.77, 0.82),
    }
  }
  return {
    emberOn,
    emberAppear: appear,
    emberFocus: 1,
    emberFall: band(p, 0.1, 0.86),
    emberLabels: band(p, 0.2, 0.3) * (1 - band(p, 0.86, 0.94)),
    emberAway: band(p, 0.86, 1),
  }
}
