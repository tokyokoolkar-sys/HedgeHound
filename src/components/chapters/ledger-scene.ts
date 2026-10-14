// κ's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band, smooth } from "@/lib/motion/math"
import type { Scene, StageState } from "@/lib/stage/store"

type LedgerChannels = Pick<Scene, "skyDim"> & Partial<Pick<Scene, "canisOn" | "canisForm" | "canisLines" | "canisLabels" | "canisAway" | "canisPlace">>

/**
 * κ: the sky dims to almost nothing over the ledger's reachable scroll (it tops out near 0.62) and Canis
 * Major re-forms around Sirius as the last image (owner decision): stars, then lines, then the Bayer
 * letters, as in α. Outside κ it returns no Canis Major keys, so α's own mapping stands. Scroll-locked and
 * reversible; reduced motion jumps to the end state.
 */
export function ledgerScene(s: StageState): LedgerChannels {
  const p = s.sections.ledger ?? 0
  if (p <= 0) return { skyDim: 1 }
  const hound = { canisOn: 1, canisAway: 0, canisPlace: 1 }
  if (s.reduced) return { skyDim: 0.12, ...hound, canisForm: 1, canisLines: 1, canisLabels: 1 }
  return {
    skyDim: 1 - 0.88 * smooth(band(p, 0, 0.4)),
    ...hound,
    canisForm: band(p, 0.02, 0.3),
    canisLines: band(p, 0.12, 0.36),
    canisLabels: band(p, 0.3, 0.42),
  }
}
