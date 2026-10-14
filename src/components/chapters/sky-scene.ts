// θ's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band } from "@/lib/motion/math"
import { arrival, departure, EDITION, RHYTHM } from "@/lib/stage/rhythm"
import type { Scene, StageState } from "@/lib/stage/store"

type AtlasChannels = Pick<Scene, "atlasOn" | "atlasAppear" | "atlasPull" | "atlasLabels" | "atlasAway">

/**
 * θ's scene channels. The atlas fills the whole sky on every layout (there is no second beat to take turns
 * with): it fades in close-up, the camera pulls back to the whole field (0.05–0.6), the recap labels
 * arrive, and it recedes as the chapter ends.
 */
export function skyScene(s: StageState): AtlasChannels {
  const p = s.sections.sky ?? 0
  const rhythm = RHYTHM
  const defs = EDITION
  const arr = arrival(s.sections, defs, "sky", rhythm)
  const dep = departure(s.sections, defs, "sky", rhythm)
  const atlasOn = arr.started && dep.until ? 1 : 0
  if (s.reduced) return { atlasOn, atlasAppear: 1, atlasPull: 1, atlasLabels: atlasOn, atlasAway: 0 }
  return {
    atlasOn,
    atlasAppear: arr.appear,
    atlasPull: band(p, 0.05, 0.6),
    atlasLabels: band(p, 0.52, 0.62) * (1 - band(p, 0.86, 0.94)),
    atlasAway: dep.away,
  }
}
