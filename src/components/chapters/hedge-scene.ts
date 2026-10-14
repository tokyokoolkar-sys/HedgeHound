// ε's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band, smooth } from "@/lib/motion/math"
import { isStacked } from "@/lib/stage/layout"
import type { Scene, StageState } from "@/lib/stage/store"

type FieldChannels = Pick<Scene, "fieldOn" | "fieldAppear" | "fieldFocus" | "fieldForm" | "fieldLabels" | "fieldAway">

/**
 * ε's scene channels. Desktop: the chart's axes rise out of depth beside the copy, the stars gather into
 * place (0.18–0.48), the labels arrive, and it stays while the copy hands over to the shortlist; it
 * recedes as the chapter ends. Stacked layouts take turns: axes tucked under the copy, then the chart
 * alone, gone before the shortlist.
 */
export function hedgeScene(s: StageState): FieldChannels {
  const p = s.sections.hedge ?? 0
  const stacked = isStacked(document.documentElement.clientWidth, window.innerHeight)
  const fieldOn = p > 0 && p < (stacked ? 0.78 : 1) ? 1 : 0
  if (s.reduced) {
    const featured = !stacked || p >= 0.53 ? 1 : 0
    return { fieldOn, fieldAppear: 1, fieldFocus: featured, fieldForm: 1, fieldLabels: fieldOn * featured, fieldAway: 0 }
  }
  const appear = smooth(band(p, 0.02, 0.2))
  if (stacked) {
    return {
      fieldOn,
      fieldAppear: appear,
      fieldFocus: band(p, 0.53, 0.6),
      fieldForm: band(p, 0.58, 0.67),
      fieldLabels: band(p, 0.65, 0.68) * (1 - band(p, 0.7, 0.73)),
      fieldAway: band(p, 0.73, 0.78),
    }
  }
  return {
    fieldOn,
    fieldAppear: appear,
    fieldFocus: 1,
    fieldForm: band(p, 0.18, 0.48),
    fieldLabels: band(p, 0.44, 0.52) * (1 - band(p, 0.86, 0.94)),
    fieldAway: band(p, 0.86, 1),
  }
}
