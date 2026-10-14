// ζ's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band, smooth } from "@/lib/motion/math"
import { isStacked } from "@/lib/stage/layout"
import type { Scene, StageState } from "@/lib/stage/store"

type KennelChannels = Pick<Scene, "kennelOn" | "kennelAppear" | "kennelFocus" | "kennelForm" | "kennelLabels" | "kennelAway">

/**
 * ζ's scene channels. Desktop: the pen rises out of depth beside the copy, the kennel coins gather into
 * it (0.18–0.48), the labels arrive, and it stays while the copy hands over to the measurements; it
 * recedes as the chapter ends. Stacked layouts take turns: pen tucked under the copy, then the kennel
 * alone, gone before the measurements.
 */
export function kennelScene(s: StageState): KennelChannels {
  const p = s.sections.kennel ?? 0
  const stacked = isStacked(document.documentElement.clientWidth, window.innerHeight)
  const kennelOn = p > 0 && p < (stacked ? 0.78 : 1) ? 1 : 0
  if (s.reduced) {
    const featured = !stacked || p >= 0.53 ? 1 : 0
    return { kennelOn, kennelAppear: 1, kennelFocus: featured, kennelForm: 1, kennelLabels: kennelOn * featured, kennelAway: 0 }
  }
  const appear = smooth(band(p, 0.02, 0.2))
  if (stacked) {
    return {
      kennelOn,
      kennelAppear: appear,
      kennelFocus: band(p, 0.53, 0.6),
      kennelForm: band(p, 0.58, 0.67),
      kennelLabels: band(p, 0.65, 0.68) * (1 - band(p, 0.7, 0.73)),
      kennelAway: band(p, 0.73, 0.78),
    }
  }
  return {
    kennelOn,
    kennelAppear: appear,
    kennelFocus: 1,
    kennelForm: band(p, 0.18, 0.48),
    kennelLabels: band(p, 0.44, 0.52) * (1 - band(p, 0.86, 0.94)),
    kennelAway: band(p, 0.86, 1),
  }
}
