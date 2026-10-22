// The glass hound (DESIGN.md signature component). Clear crystal on black: nearly invisible body, a soft
// fresnel rim, stars bent through the glass with only a hint of dispersion, one highlight that follows
// the cursor. It never animates by itself. `scene.houndAway` (0..1) sends it into depth exponentially.
// The silhouette is still the draft mark from S4 and needs proper art.
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { band, recedeDepth } from "@/lib/motion/math"
import { useStage, type Quality } from "@/lib/stage/store"
import { glassMaterial } from "../stage/glass"
import { extrudeHound, houndGeometry, houndShapesJSON, type HoundArrays } from "./hound-geometry"

let worker: Worker | null | undefined
let nextId = 0
function houndWorker(): Worker | null {
  if (worker === undefined) {
    try {
      worker = new Worker(new URL("./hound.worker.ts", import.meta.url), { type: "module" })
    } catch {
      worker = null
    }
  }
  return worker
}

/** The hound's geometry for this tier, extruded in a worker; null until it arrives. */
function useHoundGeometry(quality: Quality) {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null)
  useEffect(() => {
    let live = true
    const shapes = houndShapesJSON()
    const done = (arrays: HoundArrays) => {
      if (!live) return
      setGeo(houndGeometry(arrays))
    }
    const w = houndWorker()
    if (!w) {
      done(extrudeHound(shapes, quality))
      return () => void (live = false)
    }
    const id = ++nextId
    const onMessage = (e: MessageEvent<HoundArrays & { id: number }>) => {
      if (e.data.id === id) done(e.data)
    }
    const onError = () => done(extrudeHound(shapes, quality))
    w.addEventListener("message", onMessage)
    w.addEventListener("error", onError, { once: true })
    w.postMessage({ id, shapes, quality })
    return () => {
      live = false
      w.removeEventListener("message", onMessage)
      w.removeEventListener("error", onError)
    }
  }, [quality])
  useEffect(() => () => geo?.dispose(), [geo])
  return geo
}


export function GlassHound({ quality }: { quality: Quality }) {
  const geo = useHoundGeometry(quality)
  const ref = useRef<THREE.Group>(null)
  const { size } = useThree()
  const glass = useMemo(() => glassMaterial(), [])

  useFrame((_, dt) => {
    const s = useStage.getState()
    const g = ref.current
    if (!g) return
    const away = s.scene.houndAway
    const depth = recedeDepth(away)
    const o = 1 - band(away, 0.78, 1)
    g.visible = o > 0.001
    if (!g.visible) return
    const px = s.reduced ? 0 : s.pointer[0]
    const py = s.reduced ? 0 : s.pointer[1]
    const narrow = size.width < 768
    g.position.set(0, (narrow ? 1.2 : 0.85) + depth * 0.6, -depth * 60)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -0.32 + px * 0.22, 2.2, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.08 - py * 0.14, 2.2, dt)
    // Phones: smaller so the hound sits above the title instead of filling the width.
    g.scale.setScalar(narrow ? 0.5 : 0.8)
    const u = glass.uniforms.uLight.value as THREE.Vector2
    u.set(THREE.MathUtils.damp(u.x, 0.3 + px * 0.8, 3, dt), THREE.MathUtils.damp(u.y, 0.5 + py * 0.6, 3, dt))
    glass.uniforms.uO.value = o
  })

  return (
    <group ref={ref}>
      {geo && (
        <mesh geometry={geo}>
          <primitive object={glass} attach="material" />
        </mesh>
      )}
    </group>
  )
}
