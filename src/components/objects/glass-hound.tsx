// The glass hound (DESIGN.md signature component). Clear crystal on black: nearly invisible body, a soft
// fresnel rim, stars bent through the glass with only a hint of dispersion, one highlight that follows
// the cursor. It never animates by itself. `scene.houndAway` (0..1) sends it into depth exponentially.
// The silhouette is still the draft mark from S4 and needs proper art.
import { useFrame, useThree } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import { SVGLoader } from "three-stdlib"
import { band, recedeDepth } from "@/lib/motion/math"
import { useStage, type Quality } from "@/lib/stage/store"
import { glassMaterial } from "../stage/glass"

const HOUND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M10 60C11 50 14 41 18.5 35.5 20.8 32.6 20.2 29.6 19.2 26.4 18.2 21.5 19.4 15.4 22.6 8.6 23.2 7.2 24.2 6.8 25 7.6 28.6 11.2 30.8 16.2 31.6 21.4 32 24 33.4 25.4 35.8 26.2 38.4 27 40.4 28.4 43.4 29.2L54 31.6C57.4 32.4 59.4 33.8 59.4 36 59.4 38.4 57.4 39.6 54.6 39.8L48.6 40.2C45.4 40.6 43.4 42 42.6 44.4 41.8 47.4 42 51 42.6 54.2 43.2 57 44.2 59 45.8 60Z"/></svg>`

// PLAN §7: curve segments per tier.
const SEGMENTS: Record<Quality, { curve: number; bevel: number }> = {
  high: { curve: 72, bevel: 24 },
  mid: { curve: 40, bevel: 14 },
  low: { curve: 24, bevel: 8 },
}

function useHoundGeometry(quality: Quality) {
  const geo = useMemo(() => {
    const data = new SVGLoader().parse(HOUND_SVG)
    const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p as unknown as Parameters<typeof SVGLoader.createShapes>[0]))
    // Deep, soft bevel so every edge reads as rounded glass rather than a cut-out.
    const g = new THREE.ExtrudeGeometry(shapes, {
      depth: 4,
      bevelEnabled: true,
      bevelThickness: 4.2,
      bevelSize: 2.6,
      bevelSegments: SEGMENTS[quality].bevel,
      curveSegments: SEGMENTS[quality].curve,
    })
    g.center()
    // Flip y for SVG coordinates, and z too: one negative axis would reverse the winding (we would see the
    // inside faces with inverted normals, which drew a hard white line along the base; T15 critique).
    g.scale(0.062, -0.062, -0.062)
    g.computeVertexNormals()
    return g
  }, [quality])
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
      <mesh geometry={geo}>
        <primitive object={glass} attach="material" />
      </mesh>
    </group>
  )
}
