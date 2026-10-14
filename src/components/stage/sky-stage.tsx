// SkyStage: the one WebGL canvas for the whole app (CLAUDE.md rule 2, PLAN §4.1).
// - Rendered on the scroll engine's tick: frameloop="never" + advance() from `afterScroll`, so the 3D
//   and the DOM always share a frame (S5).
// - DPR capped by quality tier; drei PerformanceMonitor steps the tier down if frames drop.
// - Post: bite crawl + grain + vignette. No bloom.
// - Objects run their useFrame before the Projector (mount order), so projected labels see this frame's
//   transforms (the radar publishes its own, see lib/stage/radar.ts).
// - Labels render into a fixed layer above the canvas (eventSource is document.body, so drei would
//   otherwise portal them into <body> and scroll them away; D1 bug).
import { PerformanceMonitor } from "@react-three/drei"
import { Canvas, useThree } from "@react-three/fiber"
import { useEffect, useState } from "react"
import { afterScroll } from "@/lib/motion/scroll-bus"
import { palette } from "@/lib/palette"
import { useStage, type Quality } from "@/lib/stage/store"
import { Atlas } from "../objects/atlas"
import { CanisMajor } from "../objects/canis-major"
import { CometTrail } from "../objects/comet-trail"
import { FieldChart } from "../objects/field-chart"
import { EmberField } from "../objects/ember-field"
import { Kennel } from "../objects/kennel"
import { GlassHound } from "../objects/glass-hound"
import { HedgeAstrolabe } from "../objects/hedge-astrolabe"
import { Radar } from "../objects/radar"
import { CameraRig } from "./camera-rig"
import { Effects } from "./effects"
import { Projector } from "./projector"
import { Starfield } from "./starfield"

const DPR: Record<Quality, [number, number]> = { high: [1, 1.75], mid: [1, 1.5], low: [1, 1] }
const DOWN: Record<Quality, Quality> = { high: "mid", mid: "low", low: "low" }

/** Renders one frame per scroll-engine tick. */
function Driver() {
  const advance = useThree((s) => s.advance)
  useEffect(() => {
    const cb = (timeMs: number) => advance(timeMs / 1000)
    afterScroll.add(cb)
    return () => void afterScroll.delete(cb)
  }, [advance])
  return null
}

export default function SkyStage() {
  const quality = useStage((s) => s.quality)
  const [labelHost, setLabelHost] = useState<HTMLDivElement | null>(null)

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <Canvas
          frameloop="never"
          dpr={DPR[quality]}
          gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 400 }}
          eventSource={document.body}
          onCreated={({ gl }) => gl.setClearColor(palette.void)}
        >
          <Driver />
          <PerformanceMonitor onDecline={() => useStage.getState().set({ quality: DOWN[useStage.getState().quality] })} />
          <Starfield quality={quality} />
          <GlassHound quality={quality} />
          {labelHost && <CanisMajor labelHost={labelHost} />}
          <Radar />
          <HedgeAstrolabe />
          <CometTrail />
          <FieldChart />
          <Kennel />
          <EmberField />
          <Atlas />
          <CameraRig />
          <Projector />
          <Effects />
        </Canvas>
      </div>
      <div ref={setLabelHost} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" />
    </>
  )
}
