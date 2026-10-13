// HUD (DESIGN.md Layout): Sirius' real coordinate, drifting ±2° with the cursor. Bottom-left, because
// the nav now owns the top edge. Updated per frame from the scroll engine, never through React state.
import { useRef } from "react"
import { formatCoordinate } from "@/lib/stage/coordinates"
import { useScrollFrame } from "./use-scroll-frame"

export function Hud() {
  const coord = useRef<HTMLSpanElement>(null)
  useScrollFrame((s) => {
    if (coord.current) coord.current.textContent = formatCoordinate(s.reduced ? 0 : s.pointer[0], s.reduced ? 0 : s.pointer[1])
  })
  return (
    <div className="label pointer-events-none fixed bottom-5 left-[max(16px,7vw)] z-20 text-starlight-dim">
      <span ref={coord}>{formatCoordinate(0, 0)}</span>
    </div>
  )
}
