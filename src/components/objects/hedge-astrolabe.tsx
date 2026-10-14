// The γ astrolabe (DESIGN.md "Astrolabe", PLAN §3 γ): one coin, two legs. A cyan ring (long) and an
// orange ring (short) start concentric around the coin, counter-rotating with the scroll, then slide
// apart into the two venues; a hairline joins them (the spread). A price swing then carries both legs
// together while the hairline keeps its length. Thin lines like the radar, no glow; everything is
// scroll-locked (no ambient motion here). Geometry is shared with the labels via lib/stage/astrolabe.ts.
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { band, smooth } from "@/lib/motion/math"
import { R_LONG, R_SHORT, TICKS, astrolabeFrame, legs, turnFor } from "@/lib/stage/astrolabe"
import { instrumentLayout, layoutToWorld, mixLayout, tucked } from "@/lib/stage/layout"
import { useStage } from "@/lib/stage/store"
import { SKY_COLORS } from "../stage/star-points"

const starVert = /* glsl */ `
uniform float uPR; attribute float aSize; attribute float aAlpha; varying float vA;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPR;
  vA = aAlpha;
}`

// The coin: a crisp starlight point with a small halo that dies inside the sprite (no bloom).
const starFrag = /* glsl */ `
uniform float uOpacity; uniform vec3 uColor; varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d2 = dot(c, c);
  float a = (exp(-d2 * 120.0) + exp(-d2 * 14.0) * 0.3) * smoothstep(0.5, 0.42, sqrt(d2));
  a = min(a, 1.0) * uOpacity * vA;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor * pow(a, 2.2), 1.0);
}`

/** A ring with ticks pointing inward (long ticks every 8th), centred on the origin. */
function legGeometry(r: number) {
  const pts: number[] = []
  const seg = 160
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2
    const a1 = ((i + 1) / seg) * Math.PI * 2
    pts.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0)
  }
  for (let i = 0; i < TICKS; i++) {
    const a = (i / TICKS) * Math.PI * 2
    const l = i % 8 === 0 ? 0.2 : 0.08
    pts.push(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(a) * (r - l), Math.sin(a) * (r - l), 0)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3))
  return g
}

const lineMat = (color: THREE.Color) => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false })

export function HedgeAstrolabe() {
  const { size } = useThree()
  const group = useRef<THREE.Group>(null)
  const longLeg = useRef<THREE.LineSegments>(null)
  const shortLeg = useRef<THREE.LineSegments>(null)

  const longGeo = useMemo(() => legGeometry(R_LONG), [])
  const shortGeo = useMemo(() => legGeometry(R_SHORT), [])
  const longMat = useMemo(() => lineMat(SKY_COLORS.scan), [])
  const shortMat = useMemo(() => lineMat(SKY_COLORS.scent), [])

  const gap = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3))
    return g
  }, [])
  const gapMat = useMemo(() => lineMat(SKY_COLORS.star), [])

  // Two coin points, one per leg; the second only shows once they have parted (no doubled brightness).
  const coins = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3))
    g.setAttribute("aSize", new THREE.Float32BufferAttribute([11, 11], 1))
    g.setAttribute("aAlpha", new THREE.Float32BufferAttribute([1, 0], 1))
    return g
  }, [])
  const coinMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: starVert,
        fragmentShader: starFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uPR: { value: 1 }, uOpacity: { value: 0 }, uColor: { value: SKY_COLORS.star.clone() } },
      }),
    [],
  )

  useEffect(
    () => () => {
      astrolabeFrame.visible = false
      astrolabeFrame.matrix = null
      ;[longGeo, shortGeo, gap, coins].forEach((g) => g.dispose())
    },
    [longGeo, shortGeo, gap, coins],
  )

  useFrame(({ gl }) => {
    const s = useStage.getState()
    const sc = s.scene
    const g = group.current
    if (!g) return
    g.visible = sc.astroOn > 0.5
    astrolabeFrame.visible = g.visible
    if (!g.visible) return

    const layout = instrumentLayout(size.width, size.height)
    const placed = layout.mode === "narrow" ? mixLayout(tucked(layout, size.height), layout, smooth(sc.astroFocus)) : layout
    const at = layoutToWorld(placed, size.width, size.height)
    const appear = sc.astroAppear
    const away = smooth(sc.astroAway)
    const px = s.reduced ? 0 : s.pointer[0]
    const py = s.reduced ? 0 : s.pointer[1]
    g.scale.setScalar(at.scale * (0.8 + 0.2 * appear))
    g.rotation.set(-0.16 + py * 0.05, px * 0.08, 0)
    g.position.set(at.x, at.y, 0)
    g.updateMatrixWorld()
    astrolabeFrame.matrix = g.matrixWorld.elements

    const fade = appear * (1 - away)
    const { long, short } = legs(sc.spreadSplit, sc.spreadSwing)
    const turn = turnFor(sc.astroTurn)
    longLeg.current?.position.set(long[0], long[1], 0)
    shortLeg.current?.position.set(short[0], short[1], 0)
    if (longLeg.current) longLeg.current.rotation.z = turn
    if (shortLeg.current) shortLeg.current.rotation.z = -turn
    longMat.opacity = 0.6 * fade
    shortMat.opacity = 0.6 * fade

    const pos = coins.attributes.position.array as Float32Array
    pos.set([long[0], long[1], 0, short[0], short[1], 0])
    coins.attributes.position.needsUpdate = true
    const alpha = coins.attributes.aAlpha.array as Float32Array
    alpha[1] = band(sc.spreadSplit, 0.05, 0.25)
    coins.attributes.aAlpha.needsUpdate = true
    coinMat.uniforms.uOpacity.value = fade
    coinMat.uniforms.uPR.value = gl.getPixelRatio()

    // The spread: a hairline between the two coins, once they have parted.
    const gp = gap.attributes.position.array as Float32Array
    gp.set([long[0], long[1], 0, short[0], short[1], 0])
    gap.attributes.position.needsUpdate = true
    gapMat.opacity = 0.5 * band(sc.spreadSplit, 0.6, 1) * fade
  })

  return (
    <group ref={group} visible={false}>
      <lineSegments ref={longLeg} geometry={longGeo} material={longMat} />
      <lineSegments ref={shortLeg} geometry={shortGeo} material={shortMat} />
      <lineSegments geometry={gap} material={gapMat} frustumCulled={false} />
      <points geometry={coins} material={coinMat} frustumCulled={false} />
    </group>
  )
}
