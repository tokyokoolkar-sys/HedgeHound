// β's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band, smooth } from "@/lib/motion/math"
import { isStacked } from "@/lib/stage/layout"
import type { Scene, StageState } from "@/lib/stage/store"
import { enterId } from "@/content/edition"

type RadarChannels = Pick<Scene, "radarOn" | "radarAppear" | "radarFocus" | "radarLabels" | "reading" | "radarAway">

/**
 * β's scene channels. The radar arrives through the second half of the crawl, the labels and the reading
 * follow, and it all recedes as the chapter ends. Stacked layouts (phones) take turns instead: rings
 * tucked under the steps, then the radar featured alone with its reading, gone before "the rules".
 */
export function sniffScene(s: StageState): RadarChannels {
  const c = s.sections[enterId("sniff")] ?? 0
  const b = s.sections.sniff ?? 0
  const stacked = isStacked(document.documentElement.clientWidth, window.innerHeight)
  if (stacked) {
    // Phones: rings tucked under the steps, then the radar alone with its reading, gone before the rules.
    const radarOn = c >= 0.5 && b < 0.78 ? 1 : 0
    if (s.reduced) {
      const featured = b >= 0.53 ? 1 : 0
      return { radarOn, radarAppear: 1, radarFocus: featured, radarLabels: radarOn * featured, reading: radarOn * featured, radarAway: 0 }
    }
    return {
      radarOn,
      radarAppear: smooth(band(c, 0.5, 1)) * 0.6 + smooth(band(b, 0, 0.2)) * 0.4,
      radarFocus: band(b, 0.53, 0.6),
      radarLabels: band(b, 0.58, 0.62) * (1 - band(b, 0.7, 0.73)),
      reading: band(b, 0.6, 0.68) * (1 - band(b, 0.7, 0.74)),
      radarAway: band(b, 0.73, 0.78),
    }
  }
  const radarOn = c >= 0.5 && b < 1 ? 1 : 0
  if (s.reduced) return { radarOn, radarAppear: 1, radarFocus: 1, radarLabels: radarOn, reading: radarOn, radarAway: 0 }
  return {
    radarOn,
    radarAppear: smooth(band(c, 0.5, 1)) * 0.6 + smooth(band(b, 0, 0.2)) * 0.4,
    radarFocus: 1,
    radarLabels: band(b, 0.18, 0.3) * (1 - band(b, 0.86, 0.94)),
    reading: band(b, 0.26, 0.42) * (1 - band(b, 0.86, 0.96)),
    radarAway: band(b, 0.86, 1),
  }
}
