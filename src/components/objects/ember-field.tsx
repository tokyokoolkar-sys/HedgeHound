// The η ember field (DESIGN.md "Cold embers", PLAN §3 η): one ember per coin the scanner skipped on
// purpose, in three loose streams (zero rate, young, thin book; lib/stage/embers.ts). They fall with the
// scroll and stop when it stops, cooling from warm starlight to chart-line grey; never scent orange,
// which stays for alerts. Nothing decorative: every spark is a real skipped coin.
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { smooth } from "@/lib/motion/math"
import { useScan } from "@/lib/scan/use-scan"
import { EMBER_CAP, emberAt, emberFrame, placeEmbers } from "@/lib/stage/embers"
import { instrumentLayout, layoutToWorld, mixLayout, tucked } from "@/lib/stage/layout"
import { flies, useRhythm } from "@/lib/stage/rhythm"
import { useStage } from "@/lib/stage/store"
import { SKY_COLORS } from "../stage/star-points"

const vert = /* glsl */ `
uniform float uPR; attribute float aSize; attribute vec3 aColor; attribute float aAlpha;
varying vec3 vColor; varying float vA;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPR;
  vColor = aColor; vA = aAlpha;
}`

const frag = /* glsl */ `
uniform float uOpacity; varying vec3 vColor; varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d2 = dot(c, c);
  float a = min(1.0, exp(-d2 * 120.0) + exp(-d2 * 14.0) * 0.3) * smoothstep(0.5, 0.42, sqrt(d2)) * uOpacity * vA;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * pow(a, 2.2), 1.0);
}`

export function EmberField() {
  const { size } = useThree()
  const scan = useScan()
  const narrowCap = size.width < 768 ? 8 : EMBER_CAP
  const embers = useMemo(() => placeEmbers(scan.meta, narrowCap), [scan.meta, narrowCap])
  const group = useRef<THREE.Group>(null)

  const geo = useMemo(() => {
    const n = embers.length
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    g.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(n), 1))
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(embers.map((e) => 6 + e.speed * 3)), 1))
    return g
  }, [embers])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uPR: { value: 1 }, uOpacity: { value: 0 } },
      }),
    [],
  )
  const tmp = useMemo(() => new THREE.Color(), [])

  useEffect(() => () => geo.dispose(), [geo])
  useEffect(
    () => () => {
      emberFrame.visible = false
      emberFrame.matrix = null
    },
    [],
  )

  useFrame(({ gl }) => {
    const s = useStage.getState()
    const sc = s.scene
    const g = group.current
    if (!g) return
    g.visible = sc.emberOn > 0.5 && embers.length > 0
    emberFrame.visible = g.visible
    if (!g.visible) return

    const layout = instrumentLayout(size.width, size.height)
    const placed = layout.mode === "narrow" ? mixLayout(tucked(layout, size.height), layout, smooth(sc.emberFocus)) : layout
    const at = layoutToWorld(placed, size.width, size.height)
    const appear = sc.emberAppear
    const away = smooth(sc.emberAway)
    const px = s.reduced ? 0 : s.pointer[0]
    const py = s.reduced ? 0 : s.pointer[1]
    g.scale.setScalar(at.scale * (0.8 + 0.2 * appear))
    g.rotation.set(py * 0.05, px * 0.08, 0)
    g.position.set(at.x, at.y, (-2 + appear * 2 - away * 8) * (flies(useRhythm.getState().rhythm) ? 1 : 0))
    g.updateMatrixWorld()
    emberFrame.matrix = g.matrixWorld.elements

    const pos = geo.attributes.position.array as Float32Array
    const col = geo.attributes.aColor.array as Float32Array
    const alpha = geo.attributes.aAlpha.array as Float32Array
    embers.forEach((e, i) => {
      const { x, y, cool } = emberAt(e, sc.emberFall)
      pos.set([x, y, 0], i * 3)
      tmp.copy(SKY_COLORS.warm).lerp(SKY_COLORS.line, cool)
      col.set([tmp.r, tmp.g, tmp.b], i * 3)
      alpha[i] = 1 - cool * 0.55
    })
    geo.attributes.position.needsUpdate = true
    geo.attributes.aColor.needsUpdate = true
    geo.attributes.aAlpha.needsUpdate = true
    mat.uniforms.uOpacity.value = appear * (1 - away)
    mat.uniforms.uPR.value = gl.getPixelRatio()
  })

  return (
    <group ref={group} visible={false}>
      <points geometry={geo} material={mat} frustumCulled={false} />
    </group>
  )
}
