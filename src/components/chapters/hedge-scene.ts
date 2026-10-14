// ε's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band } from "@/lib/motion/math"
import { isStacked } from "@/lib/stage/layout"
import { arrival, departure, EDITION, RHYTHM } from "@/lib/stage/rhythm"
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
  const rhythm = RHYTHM
  const defs = EDITION
  const arr = arrival(s.sections, defs, "hedge", rhythm)
  const dep = departure(s.sections, defs, "hedge", rhythm)
  const fieldOn = arr.started && (stacked ? p < 0.78 : dep.until) ? 1 : 0
  if (s.reduced) {
    const featured = !stacked || p >= 0.53 ? 1 : 0
    return { fieldOn, fieldAppear: 1, fieldFocus: featured, fieldForm: 1, fieldLabels: fieldOn * featured, fieldAway: 0 }
  }
  const appear = arr.appear
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
    fieldAway: dep.away,
  }
}
