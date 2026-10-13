// Page DOM pinned to a 3D point, positioned by SkyStage every frame (lib/stage/projector.ts).
// Use this for any label whose data refreshes (radar coins, the reading); never drei <Html> (D1 ghost bug).
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { registerProjected, type Point3 } from "@/lib/stage/projector"

type Props = {
  /** World-space point, read every frame. Return null to hide the label. */
  point: () => Point3 | null
  /** CSS transform appended after the pin, e.g. "translate(0, -50%)". The element itself carries it. */
  offset?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function ProjectedLabel({ point, offset, className, style, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const pointRef = useRef(point)
  pointRef.current = point
  useEffect(() => {
    const el = ref.current
    if (!el) return
    return registerProjected({ el, point: () => pointRef.current(), offset })
  }, [offset])
  return (
    <div
      ref={ref}
      className={className}
      style={{ position: "fixed", left: 0, top: 0, pointerEvents: "none", visibility: "hidden", willChange: "transform", ...style }}
    >
      {children}
    </div>
  )
}
