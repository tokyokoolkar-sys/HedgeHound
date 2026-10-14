// The ζ kennel (DESIGN.md "Kennel", PLAN §3 ζ): our list of meme coins as a loose cluster of stars inside
// a faint pen (lib/stage/kennel.ts). Brightness is net APR (clean = scent orange); the twinkle is the
// chapter's one piece of ambient life and is measured: the shakier a coin's last six hours
// (1 − persistence), the harder and faster it trembles. A steady coin barely flickers. Gathering in,
// labels and the recede are scroll-locked; under reduced motion the twinkle holds still.
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { smooth } from "@/lib/motion/math"
import { useScan } from "@/lib/scan/use-scan"
import { KENNEL } from "@/content/edition"
import { PEN_R, kennelFrame, placeKennel } from "@/lib/stage/kennel"
import { instrumentLayout, layoutToWorld, mixLayout, tucked } from "@/lib/stage/layout"
import { useStage } from "@/lib/stage/store"
import { SKY_COLORS } from "../stage/star-points"

const starVert = /* glsl */ `
uniform float uPR, uForm, uTime;
attribute vec3 aStart; attribute float aSize; attribute vec3 aColor; attribute float aDelay; attribute float aShake; attribute float aPhase;
varying vec3 vColor; varying float vA;
void main() {
  float t = clamp((uForm - aDelay) / 0.5, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(aStart, position, t);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aSize * uPR;
  // Measured twinkle: depth and speed both grow with 1 − persistence.
  float f = 1.2 + aShake * 7.0;
  float tw = 1.0 - aShake * 0.8 * (0.5 + 0.5 * sin(uTime * f + aPhase * 40.0));
  vColor = aColor;
  vA = (0.35 + 0.65 * t) * tw;
}`

const starFrag = /* glsl */ `
uniform float uOpacity; varying vec3 vColor; varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d2 = dot(c, c);
  float a = min(1.0, exp(-d2 * 120.0) + exp(-d2 * 14.0) * 0.3) * smoothstep(0.5, 0.42, sqrt(d2)) * uOpacity * vA;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * pow(a, 2.2), 1.0);
}`

/** The pen: a faint dashed ring around the cluster. */
function penGeometry() {
  const pts: number[] = []
  const n = 120
  for (let i = 0; i < n; i += 2) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    pts.push(Math.cos(a0) * PEN_R, Math.sin(a0) * PEN_R * 0.8, 0, Math.cos(a1) * PEN_R, Math.sin(a1) * PEN_R * 0.8, 0)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3))
  return g
}

export function Kennel() {
  const { size } = useThree()
  const scan = useScan()
  const stars = useMemo(() => placeKennel(scan.rows, KENNEL), [scan.rows])
  const group = useRef<THREE.Group>(null)

  const pen = useMemo(penGeometry, [])
  const penMat = useMemo(() => new THREE.LineBasicMaterial({ color: SKY_COLORS.line, transparent: true, opacity: 0, depthWrite: false }), [])

  const points = useMemo(() => {
    const n = stars.length
    const pos = new Float32Array(n * 3)
    const start = new Float32Array(n * 3)
    const sz = new Float32Array(n)
    const col = new Float32Array(n * 3)
    const delay = new Float32Array(n)
    const shake = new Float32Array(n)
    const phase = new Float32Array(n)
    const dim = SKY_COLORS.star.clone().multiplyScalar(0.75)
    const loss = SKY_COLORS.star.clone().multiplyScalar(0.4)
    const order = [...stars].sort((a, b) => b.net - a.net)
    stars.forEach((k, i) => {
      pos.set([k.x, k.y, 0], i * 3)
      start.set([k.sx, k.sy, -4], i * 3)
      sz[i] = k.size
      const c = k.net <= 0 ? loss : k.ok ? SKY_COLORS.scent : dim
      col.set([c.r, c.g, c.b], i * 3)
      delay[i] = (order.indexOf(k) / Math.max(1, n)) * 0.5
      shake[i] = k.shake
      phase[i] = (i * 0.618) % 1
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    g.setAttribute("aStart", new THREE.BufferAttribute(start, 3))
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1))
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3))
    g.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1))
    g.setAttribute("aShake", new THREE.BufferAttribute(shake, 1))
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1))
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
        uniforms: { uPR: { value: 1 }, uForm: { value: 0 }, uTime: { value: 0 }, uOpacity: { value: 0 } },
      }),
    [],
  )

  useEffect(() => () => points.dispose(), [points])
  useEffect(
    () => () => {
      kennelFrame.visible = false
      kennelFrame.matrix = null
      pen.dispose()
    },
    [pen],
  )

  useFrame(({ clock, gl }) => {
    const s = useStage.getState()
    const sc = s.scene
    const g = group.current
    if (!g) return
    g.visible = sc.kennelOn > 0.5 && stars.length > 0
    kennelFrame.visible = g.visible
    if (!g.visible) return

    const layout = instrumentLayout(size.width, size.height)
    const placed = layout.mode === "narrow" ? mixLayout(tucked(layout, size.height), layout, smooth(sc.kennelFocus)) : layout
    const at = layoutToWorld(placed, size.width, size.height)
    const appear = sc.kennelAppear
    const away = smooth(sc.kennelAway)
    const px = s.reduced ? 0 : s.pointer[0]
    const py = s.reduced ? 0 : s.pointer[1]
    g.scale.setScalar(at.scale * (0.8 + 0.2 * appear))
    g.rotation.set(-0.12 + py * 0.05, px * 0.08, 0)
    g.position.set(at.x, at.y, -2 + appear * 2 - away * 8)
    g.updateMatrixWorld()
    kennelFrame.matrix = g.matrixWorld.elements

    const fade = appear * (1 - away)
    penMat.opacity = 0.3 * fade
    starMat.uniforms.uForm.value = sc.kennelForm
    starMat.uniforms.uTime.value = s.reduced ? 0 : clock.elapsedTime
    starMat.uniforms.uOpacity.value = fade
    starMat.uniforms.uPR.value = gl.getPixelRatio()
  })

  return (
    <group ref={group} visible={false}>
      <lineSegments geometry={pen} material={penMat} frustumCulled={false} />
      <points geometry={points} material={starMat} frustumCulled={false} />
    </group>
  )
}
