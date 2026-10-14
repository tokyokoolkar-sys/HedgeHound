// The ι desk orb (DESIGN.md "Den orb", PLAN §3 ι): a small glass orb (the hound's glass, components/stage/
// glass.ts) holding a pocket sky. The pocket sky is exactly the live coins that clear the paper book's bar
// right now (lib/stage/den.ts); with none, the orb is empty. It turns with the scroll and stops when the
// scroll stops; arrival and recede are scroll-locked too.
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { smooth } from "@/lib/motion/math"
import { useScan } from "@/lib/scan/use-scan"
import { ORB_R, clearsBar, pocketSpot } from "@/lib/stage/den"
import { instrumentLayout, layoutToWorld, mixLayout, tucked } from "@/lib/stage/layout"
import { flies, useRhythm } from "@/lib/stage/rhythm"
import { useStage } from "@/lib/stage/store"
import { glassMaterial } from "../stage/glass"
import { SKY_COLORS } from "../stage/star-points"
import { useBook } from "./use-book"

const vert = /* glsl */ `
uniform float uPR; attribute float aSize;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPR;
}`

const frag = /* glsl */ `
uniform float uOpacity; uniform vec3 uColor;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d2 = dot(c, c);
  float a = min(1.0, exp(-d2 * 120.0) + exp(-d2 * 14.0) * 0.3) * smoothstep(0.5, 0.42, sqrt(d2)) * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor * pow(a, 2.2), 1.0);
}`

export function DeskOrb() {
  const { size } = useThree()
  const scan = useScan()
  const { book } = useBook()
  const pocket = useMemo(() => clearsBar(scan.rows, book), [scan.rows, book])
  const group = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)

  const sphere = useMemo(() => new THREE.SphereGeometry(ORB_R, 72, 48), [])
  // A crisp edge only (no grey body, no highlight bloom) and no stars "seen through" the glass: everything
  // inside is real data.
  const glass = useMemo(() => glassMaterial({ rim: 0.7, spec: 0, stars: 0, broad: 0.12 }), [])
  const stars = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(pocket.length * 3)
    const sz = new Float32Array(pocket.length)
    pocket.forEach((r, i) => {
      pos.set(pocketSpot(r.symbol), i * 3)
      sz[i] = 6 + Math.min(1, r.net / 60) * 8
    })
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1))
    return g
  }, [pocket])
  const starMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        // Every pocket coin cleared a clean bar: scent orange.
        uniforms: { uPR: { value: 1 }, uOpacity: { value: 0 }, uColor: { value: SKY_COLORS.scent.clone() } },
      }),
    [],
  )

  useEffect(() => () => stars.dispose(), [stars])
  useEffect(() => () => sphere.dispose(), [sphere])

  useFrame(({ gl }, dt) => {
    const s = useStage.getState()
    const sc = s.scene
    const g = group.current
    if (!g) return
    g.visible = sc.denOn > 0.5
    if (!g.visible) return

    const layout = instrumentLayout(size.width, size.height)
    const placed = layout.mode === "narrow" ? mixLayout(tucked(layout, size.height), layout, smooth(sc.denFocus)) : layout
    const at = layoutToWorld(placed, size.width, size.height)
    const appear = sc.denAppear
    const away = smooth(sc.denAway)
    const px = s.reduced ? 0 : s.pointer[0]
    const py = s.reduced ? 0 : s.pointer[1]
    g.scale.setScalar(at.scale * (0.8 + 0.2 * appear))
    g.position.set(at.x, at.y, (-2 + appear * 2 - away * 8) * (flies(useRhythm.getState().rhythm) ? 1 : 0))
    if (spin.current) {
      spin.current.rotation.y = sc.denTurn * Math.PI * 0.9 + px * 0.2
      spin.current.rotation.x = 0.18 - py * 0.12
    }
    const fade = appear * (1 - away)
    glass.uniforms.uO.value = fade
    const u = glass.uniforms.uLight.value as THREE.Vector2
    u.set(THREE.MathUtils.damp(u.x, 0.3 + px * 0.8, 3, dt), THREE.MathUtils.damp(u.y, 0.5 + py * 0.6, 3, dt))
    starMat.uniforms.uOpacity.value = fade
    starMat.uniforms.uPR.value = gl.getPixelRatio()
  })

  return (
    <group ref={group} visible={false}>
      <group ref={spin}>
        {/* The pocket sky first, then the glass over it. */}
        <points geometry={stars} material={starMat} frustumCulled={false} renderOrder={1} />
        <mesh geometry={sphere} material={glass} renderOrder={2} />
      </group>
    </group>
  )
}
