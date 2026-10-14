// κ's scene channels (kept apart from the chapter's components so fast refresh keeps working).
import { band, smooth } from "@/lib/motion/math"
import type { Scene, StageState } from "@/lib/stage/store"

/**
 * κ: the sky dims to almost nothing over the ledger's reachable scroll (it tops out near 0.62) and Sirius comes back alone, where
 * the Edition began. Scroll-locked and reversible; reduced motion jumps to the end state.
 */
export function ledgerScene(s: StageState): Pick<Scene, "skyDim" | "siriusOn"> {
  const p = s.sections.ledger ?? 0
  if (s.reduced) return p > 0 ? { skyDim: 0.12, siriusOn: 1 } : { skyDim: 1, siriusOn: 0 }
  return { skyDim: 1 - 0.88 * smooth(band(p, 0, 0.4)), siriusOn: smooth(band(p, 0.15, 0.4)) }
}
