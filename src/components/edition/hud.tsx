// HUD (DESIGN.md Layout): Sirius' real coordinate, drifting ±2° with the cursor, bottom-left (the nav owns
// the top edge, including the scanner's status since T30).
// Updated per frame from the scroll engine, never through React state. It steps aside while a rising
// chapter's copy travels past it (T15 critique: text crossing text).
import { useRef } from "react"
import { band } from "@/lib/motion/math"
import { formatCoordinate } from "@/lib/stage/coordinates"
import { EDITION } from "@/lib/stage/rhythm"
import { applyLook } from "./look"
import { useScrollFrame } from "./use-scroll-frame"

export function Hud() {
  const hud = useRef<HTMLDivElement>(null)
  const coord = useRef<HTMLSpanElement>(null)
  useScrollFrame((s) => {
    if (coord.current) coord.current.textContent = formatCoordinate(s.reduced ? 0 : s.pointer[0], s.reduced ? 0 : s.pointer[1])
    // Fade out while any rising block is in transit (its rise band), back once it has settled.
    let passing = 0
    if (!s.reduced) {
      for (const c of EDITION.filter((d) => d.enter === "rise")) {
        const p = s.sections[c.id] ?? 0
        const [r0, r1] = c.rise ?? [0, 0.16]
        passing = Math.max(passing, band(p, r0, r0 + 0.02) * (1 - band(p, r1 - 0.03, r1)))
      }
    }
    applyLook(hud.current, { opacity: 1 - passing, y: 0, blur: 0 })
  })
  return (
    <div ref={hud} className="label pointer-events-none fixed bottom-5 left-[max(16px,7vw)] z-20 text-starlight-dim">
      <span ref={coord}>{formatCoordinate(0, 0)}</span>
    </div>
  )
}
