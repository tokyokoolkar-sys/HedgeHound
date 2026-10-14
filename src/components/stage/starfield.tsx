// The sky's depth layers (DESIGN.md "Elevation & Depth"): a far star shell that turns slowly with
// scroll and cursor, a flight layer and near dust that stream past as you scroll (parallax).
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import type * as THREE from "three"
import { useStage, type Quality } from "@/lib/stage/store"
import { FieldPoints } from "./field-points"
import { makeField, starMaterial } from "./star-points"

// PLAN §7 performance budget.
const COUNTS: Record<Quality, { shell: number; flight: number; dust: number }> = {
  high: { shell: 6000, flight: 1400, dust: 220 },
  mid: { shell: 2500, flight: 700, dust: 120 },
  low: { shell: 900, flight: 300, dust: 60 },
}

export function Starfield({ quality }: { quality: Quality }) {
  const n = COUNTS[quality]
  const shell = useMemo(
    () =>
      makeField(n.shell, 7, (r) => {
        const u = r() * 2 - 1
        const th = r() * Math.PI * 2
        const rad = 70 + r() * 70
        const s = Math.sqrt(1 - u * u)
        const bright = r() < 0.025
        return {
          p: [rad * s * Math.cos(th), rad * u, rad * s * Math.sin(th) - 20],
          size: bright ? 2.6 + r() * 2.2 : 0.7 + Math.pow(r(), 3) * 1.8,
        }
      }),
    [n.shell],
  )
  const flight = useMemo(
    () => makeField(n.flight, 11, (r) => ({ p: [(r() - 0.5) * 60, (r() - 0.5) * 40, -60 + r() * 70], size: 1.0 + r() * 1.6 })),
    [n.flight],
  )
  const dust = useMemo(
    () => makeField(n.dust, 23, (r) => ({ p: [(r() - 0.5) * 26, (r() - 0.5) * 16, -40 + r() * 50], size: 2.2 + r() * 4.5 })),
    [n.dust],
  )
  const shellMat = useMemo(() => starMaterial(), [])
  const flightMat = useMemo(() => starMaterial({ persp: true, wrap: [-60, 10] }), [])
  const dustMat = useMemo(() => starMaterial({ persp: true, soft: 1, wrap: [-40, 10] }), [])
  const shellRef = useRef<THREE.Group>(null)

  useFrame(({ clock, gl }) => {
    const s = useStage.getState()
    const fly = s.reduced ? 0 : s.scene.flight
    for (const m of [shellMat, flightMat, dustMat]) {
      // Twinkle is the only clock-driven motion in the sky (ambient life); frozen under reduced motion.
      m.uniforms.uTime.value = s.reduced ? 0 : clock.elapsedTime
      m.uniforms.uPR.value = gl.getPixelRatio()
      m.uniforms.uFlight.value = fly
    }
    // κ dims the sky to almost nothing so Sirius can stand alone (scene.skyDim; 1 = full sky).
    const dim = s.scene.skyDim
    shellMat.uniforms.uOpacity.value = dim
    flightMat.uniforms.uOpacity.value = dim
    dustMat.uniforms.uOpacity.value = 0.55 * dim
    if (shellRef.current) {
      shellRef.current.rotation.y = fly * 0.004 + s.pointer[0] * 0.02
      shellRef.current.rotation.x = s.pointer[1] * 0.012
    }
  })

  return (
    <>
      <group ref={shellRef}>
        <FieldPoints field={shell} material={shellMat} />
      </group>
      <FieldPoints field={flight} material={flightMat} />
      <FieldPoints field={dust} material={dustMat} />
    </>
  )
}
