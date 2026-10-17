// SkyStage: the one WebGL canvas for the whole app (CLAUDE.md rule 2, PLAN §4.1).
// - Rendered on the scroll engine's tick: frameloop="never" + advance() from `afterScroll`, so the 3D
//   and the DOM always share a frame (S5).
// - DPR capped by quality tier; drei PerformanceMonitor steps the tier down if frames drop.
// - Post: bite crawl + grain. No bloom, no vignette.
// - Objects run their useFrame before the Projector (mount order), so projected labels see this frame's
//   transforms (the radar publishes its own, see lib/stage/radar.ts).
// - Labels render into a fixed layer above the canvas (eventSource is document.body, so drei would
//   otherwise portal them into <body> and scroll them away; D1 bug).
// - Boot is spread out (M0 Lighthouse: the one-shot boot was most of the page's blocking time): objects
//   mount one per frame, each one's shaders compile async in its own frame, and only then does the Driver
//   start drawing. The post stack (postprocessing) is its own chunk, loaded after the first frame.
import { PerformanceMonitor } from "@react-three/drei"
import { Canvas, useThree } from "@react-three/fiber"
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react"
import type * as THREE from "three"
import { afterScroll } from "@/lib/motion/scroll-bus"
import { palette } from "@/lib/palette"
import { EDITION } from "@/lib/stage/rhythm"
import { neededObjects, SKY_OBJECTS, type SkyObject } from "@/lib/stage/sky-needs"
import { useStage, type Quality } from "@/lib/stage/store"
import { Atlas } from "../objects/atlas"
import { CanisMajor } from "../objects/canis-major"
import { CometTrail } from "../objects/comet-trail"
import { DeskOrb } from "../objects/desk-orb"
import { FieldChart } from "../objects/field-chart"
import { EmberField } from "../objects/ember-field"
import { Kennel } from "../objects/kennel"
import { GlassHound } from "../objects/glass-hound"
import { HedgeAstrolabe } from "../objects/hedge-astrolabe"
import { Radar } from "../objects/radar"
import { Travelers } from "../objects/travelers"
import { CameraRig } from "./camera-rig"
import { Projector } from "./projector"
import { Starfield } from "./starfield"

const Effects = lazy(() => import("./effects").then((m) => ({ default: m.Effects })))

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

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

/**
 * Compiles every material in the scene before it is drawn, one top-level object per frame: all of them
 * before the first draw, then (mid/low tier) each object mounted later as the reader nears its chapter.
 * three only compiles what is visible, and most objects hide outside their chapter, so each subtree is
 * made visible for its compile and put back. KHR_parallel_shader_compile (where present) keeps it off
 * the main thread; elsewhere each object's compile is at least its own short task.
 * (Tried and dropped: a scissored 1 px warm-up draw per object to pre-upload buffers. On a software GPU,
 * as in Lighthouse, it still runs every vertex and blocked the main thread far longer; M0 note.)
 */
const compiled = new WeakSet<THREE.Object3D>()
function Precompile({ onDone, version }: { onDone: () => void; version: string }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    let cancelled = false
    void (async () => {
      for (const child of [...scene.children]) {
        if (cancelled) return
        if (compiled.has(child)) continue
        compiled.add(child)
        const hidden: THREE.Object3D[] = []
        child.traverse((o) => {
          if (!o.visible) {
            hidden.push(o)
            o.visible = true
          }
        })
        try {
          await gl.compileAsync(child, camera, scene)
        } catch {
          // A failed precompile only costs the old behaviour: that object compiles on its first draw.
        } finally {
          for (const o of hidden) o.visible = false
        }
        await nextFrame()
      }
      if (!cancelled) onDone()
    })()
    return () => void (cancelled = true)
  }, [gl, scene, camera, onDone, version])
  return null
}

type Layer = { key: string; node: ReactNode }

/**
 * Mounts `layers` one per frame, in their order, as they appear in the list (more arrive later on mid/low
 * tiers). `tail` (the camera rig and the Projector) is re-keyed whenever a layer mounts, so it always
 * mounts after every object: useFrame order is mount order, and projected labels must see this frame's
 * transforms. `onMounted` fires once, when the first set is in; `onVersion` reports every change to what
 * is mounted (Precompile picks up the newcomers).
 */
function Staged({
  layers,
  tail,
  onMounted,
  onVersion,
}: {
  layers: Layer[]
  tail: (version: string) => ReactNode
  onMounted: () => void
  onVersion: (version: string) => void
}) {
  const [mounted, setMounted] = useState<ReadonlySet<string>>(() => new Set())
  const [first, setFirst] = useState(true)
  const next = layers.find((l) => !mounted.has(l.key))?.key
  useEffect(() => {
    if (!next) {
      if (first) {
        setFirst(false)
        onMounted()
      }
      return
    }
    const id = requestAnimationFrame(() => setMounted((m) => new Set(m).add(next)))
    return () => cancelAnimationFrame(id)
  }, [next, first, onMounted])
  const shown = layers.filter((l) => mounted.has(l.key))
  const version = shown.map((l) => l.key).join(",")
  useEffect(() => onVersion(version), [version, onVersion])
  return (
    <>
      {shown.map((l) => l.node)}
      {tail(version)}
    </>
  )
}

const ORDER = EDITION.map((c) => c.id)

/**
 * The objects to mount. High tier: all of them up front (as before). Mid/low (phones, weak devices): those
 * the reader is within a chapter of, or the page is built around (lib/stage/sky-needs.ts); once mounted an
 * object stays, so scrolling back never remounts it.
 */
function useSkyObjects(quality: Quality): ReadonlySet<SkyObject> {
  const lazy = quality !== "high"
  // A string, so the store's every-frame writes only re-render here when the answer changes.
  const needed = useStage((s) => (lazy ? [...neededObjects(s.mode, s.active, ORDER)].sort().join(",") : SKY_OBJECTS.join(",")))
  const [kept, setKept] = useState<ReadonlySet<SkyObject>>(() => new Set(needed.split(",").filter(Boolean) as SkyObject[]))
  useEffect(() => {
    const want = needed.split(",").filter(Boolean) as SkyObject[]
    setKept((k) => (want.every((o) => k.has(o)) ? k : new Set([...k, ...want])))
  }, [needed])
  return kept
}

type Boot = "mounting" | "compiling" | "effects" | "live"

export default function SkyStage() {
  const quality = useStage((s) => s.quality)
  const objects = useSkyObjects(quality)
  const [labelHost, setLabelHost] = useState<HTMLDivElement | null>(null)
  const [boot, setBoot] = useState<Boot>("mounting")
  const [onMounted] = useState(() => () => setBoot("compiling"))
  // Precompile reports again for every later newcomer; only the first report moves the boot on.
  const [onCompiled] = useState(() => () => setBoot((b) => (b === "compiling" ? "effects" : b)))
  const [onEffects] = useState(() => () => setBoot("live"))
  // If the post stack never reports ready (a failed chunk, a driver quirk), draw without waiting on it.
  useEffect(() => {
    if (boot !== "effects") return
    const id = window.setTimeout(onEffects, 3000)
    return () => window.clearTimeout(id)
  }, [boot, onEffects])

  // The original mount order; objects not wanted yet are simply absent.
  const all: Array<[SkyObject | "starfield", ReactNode]> = [
    ["starfield", <Starfield key="starfield" quality={quality} />],
    ["hound", <GlassHound key="hound" quality={quality} />],
    ["canis", labelHost ? <CanisMajor key="canis" labelHost={labelHost} /> : null],
    ["radar", <Radar key="radar" />],
    ["astrolabe", <HedgeAstrolabe key="astrolabe" />],
    ["comet", <CometTrail key="comet" />],
    ["field", <FieldChart key="field" />],
    ["kennel", <Kennel key="kennel" />],
    ["embers", <EmberField key="embers" />],
    ["atlas", <Atlas key="atlas" />],
    ["orb", <DeskOrb key="orb" />],
    ["travelers", <Travelers key="travelers" />],
  ]
  const layers: Layer[] = all
    .filter(([k, node]) => node !== null && (k === "starfield" || objects.has(k)))
    .map(([key, node]) => ({ key, node }))
  const [tail] = useState(() => (version: string) => [<CameraRig key={`rig:${version}`} />, <Projector key={`projector:${version}`} />])
  const [version, setVersion] = useState("")

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
          {boot === "live" && <Driver />}
          <PerformanceMonitor onDecline={() => useStage.getState().set({ quality: DOWN[useStage.getState().quality] })} />
          <Staged layers={layers} tail={tail} onMounted={onMounted} onVersion={setVersion} />
          {boot !== "mounting" && <Precompile onDone={onCompiled} version={version} />}
          {(boot === "effects" || boot === "live") && (
            <Suspense fallback={null}>
              <Effects onReady={onEffects} />
            </Suspense>
          )}
        </Canvas>
      </div>
      <div ref={setLabelHost} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" />
    </>
  )
}
