// γ's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band } from "@/lib/motion/math"
import { isStacked } from "@/lib/stage/layout"
import { arrival, departure, EDITION, RHYTHM } from "@/lib/stage/rhythm"
import type { Scene, StageState } from "@/lib/stage/store"

type AstroChannels = Pick<
  Scene,
  "astroOn" | "astroAppear" | "astroFocus" | "astroTurn" | "spreadSplit" | "legLabels" | "spreadSwing" | "astroAway"
>

/**
 * γ's scene channels. Desktop: the astrolabe rises out of depth beside the copy, its legs split
 * (0.22–0.45), the labels arrive, then the price swing (0.5–0.7) runs while the copy hands over to the
 * live legs; it recedes as the chapter ends. Stacked layouts take turns: rings tucked under the steps,
 * then the astrolabe alone (split, swing), gone before the second beat.
 */
export function spreadScene(s: StageState): AstroChannels {
  const p = s.sections.spread ?? 0
  const stacked = isStacked(document.documentElement.clientWidth, window.innerHeight)
  const rhythm = RHYTHM
  const defs = EDITION
  const arr = arrival(s.sections, defs, "spread", rhythm, stacked)
  const dep = departure(s.sections, defs, "spread", rhythm, s.reduced)
  const astroOn = arr.started && (stacked ? p < 0.78 : dep.until) ? 1 : 0
  if (s.reduced) {
    const featured = !stacked || p >= 0.53 ? 1 : 0
    return {
      astroOn,
      astroAppear: 1,
      astroFocus: featured,
      astroTurn: 0,
      spreadSplit: featured,
      legLabels: astroOn * featured,
      spreadSwing: 0,
      astroAway: 0,
    }
  }
  const appear = arr.appear
  if (stacked) {
    return {
      astroOn,
      astroAppear: appear,
      astroFocus: band(p, 0.53, 0.6),
      astroTurn: p,
      spreadSplit: band(p, 0.58, 0.64),
      legLabels: band(p, 0.62, 0.65) * (1 - band(p, 0.7, 0.73)),
      spreadSwing: band(p, 0.63, 0.7),
      astroAway: band(p, 0.73, 0.78),
    }
  }
  return {
    astroOn,
    astroAppear: appear,
    astroFocus: 1,
    astroTurn: p,
    spreadSplit: band(p, 0.22, 0.45),
    legLabels: band(p, 0.4, 0.48) * (1 - band(p, 0.86, 0.94)),
    spreadSwing: band(p, 0.5, 0.7),
    astroAway: dep.away,
  }
}
