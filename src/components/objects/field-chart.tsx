// The ε field chart (DESIGN.md "Field chart", PLAN §3 ε): every live coin as a star on two honest axes,
// net APR after costs across (with a hairline at break-even) and persistence up (lib/stage/field.ts).
// The stars gather from scattered sky into place as you scroll. Clean scents are scent orange, coins
// still building history dim starlight, spreads that lose after costs dimmer still. Thin lines, no glow;
// scroll-locked.
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { smooth } from "@/lib/motion/math"
import { useScan } from "@/lib/scan/use-scan"
import { FIELD_H, FIELD_W, NET_TICKS, fieldFrame, netX, placeField } from "@/lib/stage/field"
import { instrumentLayout, layoutToWorld, mixLayout, tucked } from "@/lib/stage/layout"
import { useStage } from "@/lib/stage/store"
import { SKY_COLORS } from "../stage/star-points"

const starVert = /* glsl */ `
uniform float uPR, uForm;
attribute vec3 aStart; attribute float aSize; attribute vec3 aColor; attribute float aDelay;
varying vec3 vColor; varying float vA;
void main() {
  float t = clamp((uForm - aDelay) / 0.5, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(aStart, position, t);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aSize * uPR;
  vColor = aColor;
  vA = 0.35 + 0.65 * t;
}`

const starFrag = /* glsl */ `
uniform float uOpacity; varying vec3 vColor; varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d2 = dot(c, c);
  float a = min(1.0, exp(-d2 * 120.0) + exp(-d2 * 14.0) * 0.3) * smoothstep(0.5, 0.42, sqrt(d2)) * uOpacity * vA;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * pow(a, 2.2), 1.0);
}`

const lines = (pts: number[]) => {
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3))
  return g
}
const lineMat = (color: THREE.Color) => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false })

/** Axes: the bottom (net) and left (held) edges, with ticks. */
function axesGeometry() {
  const pts: number[] = [-FIELD_W, -FIELD_H, 0, FIELD_W, -FIELD_H, 0, -FIELD_W, -FIELD_H, 0, -FIELD_W, FIELD_H, 0]
  for (const n of NET_TICKS) pts.push(netX(n), -FIELD_H, 0, netX(n), -FIELD_H - 0.1, 0)
  for (const p of [0, 0.5, 1]) {
    const y = -FIELD_H + 2 * FIELD_H * p
    pts.push(-FIELD_W, y, 0, -FIELD_W - 0.1, y, 0)
  }
  return lines(pts)
}

export function FieldChart() {
  const { size } = useThree()
  const scan = useScan()
  const stars = useMemo(() => placeField(scan.rows), [scan.rows])
  const group = useRef<THREE.Group>(null)

  const axes = useMemo(axesGeometry, [])
  const axesMat = useMemo(() => lineMat(SKY_COLORS.line), [])
  const zero = useMemo(() => lines([netX(0), -FIELD_H, 0, netX(0), FIELD_H, 0]), [])
  const zeroMat = useMemo(() => lineMat(SKY_COLORS.star), [])

  const points = useMemo(() => {
    const n = stars.length
    const pos = new Float32Array(n * 3)
    const start = new Float32Array(n * 3)
    const sz = new Float32Array(n)
    const col = new Float32Array(n * 3)
    const delay = new Float32Array(n)
    const dim = SKY_COLORS.star.clone().multiplyScalar(0.7)
    const loss = SKY_COLORS.star.clone().multiplyScalar(0.38)
    const order = [...stars].sort((a, b) => b.net - a.net)
    stars.forEach((k, i) => {
      pos.set([k.x, k.y, 0], i * 3)
      start.set([k.sx, k.sy, -4], i * 3)
      sz[i] = k.size
      const c = k.net <= 0 ? loss : k.ok ? SKY_COLORS.scent : dim
      col.set([c.r, c.g, c.b], i * 3)
      // Louder coins settle first.
      delay[i] = (order.indexOf(k) / Math.max(1, n)) * 0.5
    })
    const g = lines(Array.from(pos))
    g.setAttribute("aStart", new THREE.BufferAttribute(start, 3))
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1))
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3))
    g.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1))
    return g
  }, [stars])
  const starMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: starVert,
        fragmentShader: starFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uPR: { value: 1 }, uForm: { value: 0 }, uOpacity: { value: 0 } },
      }),
    [],
  )

  useEffect(() => () => points.dispose(), [points])
  useEffect(
    () => () => {
      fieldFrame.visible = false
      fieldFrame.matrix = null
      ;[axes, zero].forEach((g) => g.dispose())
    },
    [axes, zero],
  )

  useFrame(({ gl }) => {
    const s = useStage.getState()
    const sc = s.scene
    const g = group.current
    if (!g) return
    g.visible = sc.fieldOn > 0.5 && stars.length > 0
    fieldFrame.visible = g.visible
    if (!g.visible) return

    const layout = instrumentLayout(size.width, size.height)
    const placed = layout.mode === "narrow" ? mixLayout(tucked(layout, size.height), layout, smooth(sc.fieldFocus)) : layout
    const at = layoutToWorld(placed, size.width, size.height)
    const appear = sc.fieldAppear
    const away = smooth(sc.fieldAway)
    const px = s.reduced ? 0 : s.pointer[0]
    const py = s.reduced ? 0 : s.pointer[1]
    g.scale.setScalar(at.scale * (0.8 + 0.2 * appear))
    g.rotation.set(-0.1 + py * 0.05, px * 0.08, 0)
    g.position.set(at.x, at.y, 0)
    g.updateMatrixWorld()
    fieldFrame.matrix = g.matrixWorld.elements

    const fade = appear * (1 - away)
    axesMat.opacity = 0.4 * fade
    zeroMat.opacity = 0.4 * fade * Math.min(1, sc.fieldForm * 2)
    starMat.uniforms.uForm.value = sc.fieldForm
    starMat.uniforms.uOpacity.value = fade
    starMat.uniforms.uPR.value = gl.getPixelRatio()
  })

  return (
    <group ref={group} visible={false}>
      <lineSegments geometry={axes} material={axesMat} frustumCulled={false} />
      <lineSegments geometry={zero} material={zeroMat} frustumCulled={false} />
      <points geometry={points} material={starMat} frustumCulled={false} />
    </group>
  )
}
