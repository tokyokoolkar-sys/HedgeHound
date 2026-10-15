// θ's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band } from "@/lib/motion/math"
import { arrival, departure, EDITION, RHYTHM } from "@/lib/stage/rhythm"
import type { Scene, StageState } from "@/lib/stage/store"

type AtlasChannels = Pick<
  Scene,
  "atlasOn" | "atlasAppear" | "atlasPull" | "atlasLabels" | "atlasAway" | "atlasFocus" | "atlasFx" | "atlasFy" | "atlasFz" | "atlasDepth" | "atlasFly" | "atlasInset"
>

/** In the Edition the field is flat and never takes a focus (that is /sky's, T33). */
const FLAT = { atlasFocus: 0, atlasFx: 0, atlasFy: 0, atlasFz: 0, atlasDepth: 0, atlasFly: 0, atlasInset: 0 }

/**
 * θ's scene channels. The atlas fills the whole sky on every layout (there is no second beat to take turns
 * with): it fades in close-up, the camera pulls back to the whole field (0.04–0.28), the recap labels
 * arrive, and it recedes as the chapter ends.
 */
export function skyScene(s: StageState): AtlasChannels {
  const p = s.sections.sky ?? 0
  const rhythm = RHYTHM
  const defs = EDITION
  const arr = arrival(s.sections, defs, "sky", rhythm)
  const dep = departure(s.sections, defs, "sky", rhythm, s.reduced)
  const atlasOn = arr.started && dep.until ? 1 : 0
  if (s.reduced) return { ...FLAT, atlasOn, atlasAppear: 1, atlasPull: 1, atlasLabels: atlasOn, atlasAway: 0 }
  return {
    ...FLAT,
    atlasOn,
    atlasAppear: arr.appear,
    // The pull-back settles early and the labels follow it, so θ never reads as an empty sky (owner, P4
    // close: "a little louder") and no label rides the moving field to the edge.
    atlasPull: band(p, 0.04, 0.28),
    atlasLabels: band(p, 0.26, 0.34) * (1 - band(p, 0.86, 0.94)),
    atlasAway: dep.away,
  }
}
