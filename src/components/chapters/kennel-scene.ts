// ζ's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band } from "@/lib/motion/math"
import { isStacked } from "@/lib/stage/layout"
import { arrival, departure, EDITION, RHYTHM } from "@/lib/stage/rhythm"
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
  const rhythm = RHYTHM
  const defs = EDITION
  const arr = arrival(s.sections, defs, "kennel", rhythm, stacked)
  const dep = departure(s.sections, defs, "kennel", rhythm, s.reduced)
  const kennelOn = arr.started && (stacked ? p < 0.78 : dep.until) ? 1 : 0
  if (s.reduced) {
    const featured = !stacked || p >= 0.53 ? 1 : 0
    return { kennelOn, kennelAppear: 1, kennelFocus: featured, kennelForm: 1, kennelLabels: kennelOn * featured, kennelAway: 0 }
  }
  const appear = arr.appear
  if (stacked) {
    return {
      kennelOn,
      kennelAppear: appear,
      // The featured moment is never empty: the coins gather as it grows and the labels hold until it goes.
      kennelFocus: band(p, 0.52, 0.58),
      kennelForm: band(p, 0.52, 0.62),
      kennelLabels: band(p, 0.59, 0.63) * (1 - band(p, 0.71, 0.74)),
      kennelAway: band(p, 0.73, 0.78),
    }
  }
  return {
    kennelOn,
    kennelAppear: appear,
    kennelFocus: 1,
    // Settled before the copy's body is readable (P4 critique: an empty pen while the copy explains it).
    kennelForm: band(p, 0.04, 0.26),
    kennelLabels: band(p, 0.24, 0.32) * (1 - band(p, 0.86, 0.94)),
    kennelAway: dep.away,
  }
}
