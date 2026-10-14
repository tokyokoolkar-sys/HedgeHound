// HUD (DESIGN.md Layout): Sirius' real coordinate, drifting ±2° with the cursor, bottom-left (the nav owns
// the top edge). On desktop a second line says where the figures come from, so SAMPLE always has a reason.
// Updated per frame from the scroll engine, never through React state. It steps aside while a rising
// chapter's copy travels past it (T15 critique: text crossing text).
import { useRef } from "react"
import { CHAPTERS } from "@/content/edition"
import { band } from "@/lib/motion/math"
import { useScan } from "@/lib/scan/use-scan"
import { formatCoordinate } from "@/lib/stage/coordinates"
import { applyLook } from "./look"
import { SourceTag } from "./source-tag"
import { useScrollFrame } from "./use-scroll-frame"

const RISING = CHAPTERS.filter((c) => c.enter === "rise")

export function Hud() {
  const hud = useRef<HTMLDivElement>(null)
  const coord = useRef<HTMLSpanElement>(null)
  const scan = useScan()
  useScrollFrame((s) => {
    if (coord.current) coord.current.textContent = formatCoordinate(s.reduced ? 0 : s.pointer[0], s.reduced ? 0 : s.pointer[1])
    // Fade out while any rising block is in transit (its rise band), back once it has settled.
    let passing = 0
    if (!s.reduced) {
      for (const c of RISING) {
        const p = s.sections[c.id] ?? 0
        const [r0, r1] = c.rise ?? [0, 0.16]
        passing = Math.max(passing, band(p, r0, r0 + 0.02) * (1 - band(p, r1 - 0.03, r1)))
      }
    }
    applyLook(hud.current, { opacity: 1 - passing, y: 0, blur: 0 })
  })
  return (
    <div ref={hud} className="label pointer-events-none fixed bottom-5 left-[max(16px,7vw)] z-20 flex items-baseline gap-4 text-starlight-dim">
      <span ref={coord}>{formatCoordinate(0, 0)}</span>
      {!scan.loading && (
        <span className="hidden items-baseline gap-2 md:inline-flex">
          {scan.live ? "scanner live" : "scanner offline · showing a sample"}
          <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
        </span>
      )}
    </div>
  )
}
