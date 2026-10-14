// δ's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band, smooth } from "@/lib/motion/math"
import { isStacked } from "@/lib/stage/layout"
import type { Scene, StageState } from "@/lib/stage/store"

type TrailChannels = Pick<Scene, "trailOn" | "trailAppear" | "trailFocus" | "trailDraw" | "trailMarks" | "trailAway">

/**
 * δ's scene channels. Desktop: the day's arc rises out of depth beside the copy, the coin replays its
 * day (0.18–0.5), then the flip tick and the six-hour bracket arrive while the copy hands over to the
 * steadiest six; it recedes as the chapter ends. Stacked layouts take turns: the arc tucked under the
 * copy, then the trail alone, gone before the second beat.
 */
export function trailScene(s: StageState): TrailChannels {
  const p = s.sections.trail ?? 0
  const stacked = isStacked(document.documentElement.clientWidth, window.innerHeight)
  const trailOn = p > 0 && p < (stacked ? 0.78 : 1) ? 1 : 0
  if (s.reduced) {
    const featured = !stacked || p >= 0.53 ? 1 : 0
    return { trailOn, trailAppear: 1, trailFocus: featured, trailDraw: 1, trailMarks: trailOn * featured, trailAway: 0 }
  }
  const appear = smooth(band(p, 0.02, 0.2))
  if (stacked) {
    return {
      trailOn,
      trailAppear: appear,
      trailFocus: band(p, 0.53, 0.6),
      trailDraw: band(p, 0.58, 0.67),
      trailMarks: band(p, 0.65, 0.68) * (1 - band(p, 0.7, 0.73)),
      trailAway: band(p, 0.73, 0.78),
    }
  }
  return {
    trailOn,
    trailAppear: appear,
    trailFocus: 1,
    trailDraw: band(p, 0.18, 0.5),
    trailMarks: band(p, 0.53, 0.6) * (1 - band(p, 0.86, 0.94)),
    trailAway: band(p, 0.86, 1),
  }
}
