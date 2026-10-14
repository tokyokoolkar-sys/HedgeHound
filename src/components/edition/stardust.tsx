// Text that gathers out of fine star specks as `progress` goes 0 → 1 (DESIGN.md "The reading").
// Scroll-driven and reversible. The element carries any offset itself (mask rule from D1).
import { useRef, type CSSProperties, type ReactNode } from "react"
import type { StageState } from "@/lib/stage/store"
import { applyStardust } from "./masks"
import { useScrollFrame } from "./use-scroll-frame"

type Props = {
  /** 0..1 from the stage state (e.g. a section's progress, banded). */
  progress: (s: StageState) => number
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function Stardust({ progress, className, style, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useScrollFrame((s) => {
    // Reduced motion jumps to the end state, but only while the text is meant to be there at all.
    const p = progress(s)
    if (ref.current) applyStardust(ref.current, s.reduced ? (p > 0 ? 1 : 0) : p)
  })
  return (
    <div ref={ref} className={className} style={{ visibility: "hidden", ...style }}>
      {children}
    </div>
  )
}
