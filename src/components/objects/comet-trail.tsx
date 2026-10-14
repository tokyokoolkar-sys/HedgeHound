// The δ comet trail (DESIGN.md "Comet trail", PLAN §3 δ): the loudest scent's last day, drawn only from
// the scanner's live fields (lib/stage/comet.ts). A faint 24-hour arc with six-hour ticks; the coin's star
// replays the day along it, laying the trail behind: solid in the current direction's colour since the
// last flip, faint and dotted before it (the scanner doesn't say what happened there), nothing where there
// are no samples. Then a tick at the flip and a bracket over the last six hours (persistence).
// Thin lines, no glow; everything is scroll-locked.
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { smooth } from "@/lib/motion/math"
import { pickLoudest } from "@/lib/scan/loudest"
import { useScan } from "@/lib/scan/use-scan"
import { DAY_H, RECENT_H, arcNormal, arcPoint, directionRole, flipped, headAt, offsetPoint, segments, trailFrame } from "@/lib/stage/comet"
import { instrumentLayout, layoutToWorld, mixLayout, tucked } from "@/lib/stage/layout"
import { useStage } from "@/lib/stage/store"
import { SKY_COLORS } from "../stage/star-points"

/** Trail resolution: one segment per 7.5 minutes of the day. */
const STEPS = 192

const trailVert = /* glsl */ `
attribute float aKind; attribute float aH; attribute float aIdx;
varying float vKind; varying float vH; varying float vIdx;
void main() {
  vKind = aKind; vH = aH; vIdx = aIdx;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

// kind 1 = held (solid, direction colour), 2 = before the flip (dotted, faint starlight), 0 = no samples.
const trailFrag = /* glsl */ `
uniform float uHead, uOpacity; uniform vec3 uHeld, uBefore;
varying float vKind; varying float vH; varying float vIdx;
void main() {
  if (vKind < 0.5 || vH < uHead) discard;
  bool held = vKind < 1.5;
  if (!held && mod(floor(vIdx + 0.5), 5.0) > 2.5) discard;     // dashes: 3 on, 2 off
  vec3 c = held ? uHeld : uBefore;
  float a = (held ? 1.0 : 0.6) * uOpacity;
  gl_FragColor = vec4(c * pow(a, 2.2), 1.0);
}`

const starVert = /* glsl */ `
uniform float uPR; void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = 12.0 * uPR; }`
const starFrag = /* glsl */ `
uniform float uOpacity; uniform vec3 uColor;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d2 = dot(c, c);
  float a = min(1.0, exp(-d2 * 120.0) + exp(-d2 * 14.0) * 0.3) * smoothstep(0.5, 0.42, sqrt(d2)) * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor * pow(a, 2.2), 1.0);
}`

const lines = (pts: number[]) => {
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3))
  return g
}
const lineMat = (color: THREE.Color) => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false })

/** The 24-hour axis: the full arc plus a tick every six hours. */
function axisGeometry() {
  const pts: number[] = []
  for (let i = 0; i < STEPS; i++) {
    const a = arcPoint(DAY_H - (i / STEPS) * DAY_H)
    const b = arcPoint(DAY_H - ((i + 1) / STEPS) * DAY_H)
    pts.push(a[0], a[1], 0, b[0], b[1], 0)
  }
  for (let h = 0; h <= DAY_H; h += 6) {
    const [x, y] = arcPoint(h)
    const [nx, ny] = arcNormal(h)
    pts.push(x - nx * 0.12, y - ny * 0.12, 0, x + nx * 0.12, y + ny * 0.12, 0)
  }
  return lines(pts)
}

/** The six-hour bracket, offset above the arc, with end ticks. */
function bracketGeometry() {
  const pts: number[] = []
  const n = 48
  for (let i = 0; i < n; i++) {
    const a = offsetPoint((i / n) * RECENT_H, 0.32)
    const b = offsetPoint(((i + 1) / n) * RECENT_H, 0.32)
    pts.push(a[0], a[1], 0, b[0], b[1], 0)
  }
  for (const h of [0, RECENT_H]) {
    const a = offsetPoint(h, 0.22)
    const b = offsetPoint(h, 0.32)
    pts.push(a[0], a[1], 0, b[0], b[1], 0)
  }
  return lines(pts)
}

export function CometTrail() {
  const { size } = useThree()
  const scan = useScan()
  const row = useMemo(() => {
    const l = pickLoudest(scan.rows)
    return scan.rows.find((r) => r.symbol === l?.symbol) ?? null
  }, [scan.rows])
  const group = useRef<THREE.Group>(null)

  const axis = useMemo(axisGeometry, [])
  const axisMat = useMemo(() => lineMat(SKY_COLORS.line), [])
  const bracket = useMemo(bracketGeometry, [])
  const bracketMat = useMemo(() => lineMat(SKY_COLORS.star), [])

  // The trail: every segment of the day, tagged held / before / none from the live fields.
  const trail = useMemo(() => {
    const segs = row ? segments(row) : []
    const pos: number[] = []
    const kind: number[] = []
    const hrs: number[] = []
    const idx: number[] = []
    for (let i = 0; i < STEPS; i++) {
      const h0 = (i / STEPS) * DAY_H
      const h1 = ((i + 1) / STEPS) * DAY_H
      const mid = (h0 + h1) / 2
      const seg = segs.find((s) => mid >= s.from && mid < s.to)
      const k = seg ? (seg.kind === "held" ? 1 : 2) : 0
      const a = arcPoint(h0)
      const b = arcPoint(h1)
      pos.push(a[0], a[1], 0, b[0], b[1], 0)
      kind.push(k, k)
      hrs.push(mid, mid)
      idx.push(i, i)
    }
    const g = lines(pos)
    g.setAttribute("aKind", new THREE.Float32BufferAttribute(kind, 1))
    g.setAttribute("aH", new THREE.Float32BufferAttribute(hrs, 1))
    g.setAttribute("aIdx", new THREE.Float32BufferAttribute(idx, 1))
    return g
  }, [row])
  const trailMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: trailVert,
        fragmentShader: trailFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uHead: { value: DAY_H },
          uOpacity: { value: 0 },
          uHeld: { value: SKY_COLORS.scent.clone() },
          uBefore: { value: SKY_COLORS.star.clone() },
        },
      }),
    [],
  )
  useEffect(() => {
    const role = row ? directionRole(row.short) : "scent"
    ;(trailMat.uniforms.uHeld.value as THREE.Color).copy(role === "scan" ? SKY_COLORS.scan : SKY_COLORS.scent)
  }, [row, trailMat])

  const flipTick = useMemo(() => lines([0, 0, 0, 0, 0, 0]), [])
  const flipMat = useMemo(() => lineMat(SKY_COLORS.star), [])
  const head = useMemo(() => lines([0, 0, 0]), [])
  const headMat = useMemo(
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

  useEffect(() => () => trail.dispose(), [trail])
  useEffect(
    () => () => {
      trailFrame.visible = false
      trailFrame.matrix = null
      ;[axis, bracket, flipTick, head].forEach((g) => g.dispose())
    },
    [axis, bracket, flipTick, head],
  )

  useFrame(({ gl }) => {
    const s = useStage.getState()
    const sc = s.scene
    const g = group.current
    if (!g) return
    g.visible = sc.trailOn > 0.5 && !!row
    trailFrame.visible = g.visible
    if (!g.visible || !row) return

    const layout = instrumentLayout(size.width, size.height)
    const placed = layout.mode === "narrow" ? mixLayout(tucked(layout, size.height), layout, smooth(sc.trailFocus)) : layout
    const at = layoutToWorld(placed, size.width, size.height)
    const appear = sc.trailAppear
    const away = smooth(sc.trailAway)
    const px = s.reduced ? 0 : s.pointer[0]
    const py = s.reduced ? 0 : s.pointer[1]
    g.scale.setScalar(at.scale * (0.8 + 0.2 * appear))
    g.rotation.set(-0.14 + py * 0.05, px * 0.08, 0)
    g.position.set(at.x, at.y, 0)
    g.updateMatrixWorld()
    trailFrame.matrix = g.matrixWorld.elements

    const fade = appear * (1 - away)
    const hHead = headAt(sc.trailDraw, row)
    axisMat.opacity = 0.16 * fade
    trailMat.uniforms.uHead.value = hHead
    trailMat.uniforms.uOpacity.value = fade

    const hp = arcPoint(hHead)
    ;(head.attributes.position.array as Float32Array).set([hp[0], hp[1], 0])
    head.attributes.position.needsUpdate = true
    headMat.uniforms.uOpacity.value = fade * Math.min(1, sc.trailDraw * 8)
    headMat.uniforms.uPR.value = gl.getPixelRatio()

    // The flip tick crosses the trail where the sign last changed; the bracket covers the last six hours.
    const marks = sc.trailMarks * fade
    if (flipped(row)) {
      const h = Math.min(DAY_H, row.hours_since_flip)
      const [x, y] = arcPoint(h)
      const [nx, ny] = arcNormal(h)
      ;(flipTick.attributes.position.array as Float32Array).set([x - nx * 0.22, y - ny * 0.22, 0, x + nx * 0.22, y + ny * 0.22, 0])
      flipTick.attributes.position.needsUpdate = true
      flipMat.opacity = 0.7 * marks
    } else flipMat.opacity = 0
    bracketMat.opacity = 0.5 * marks
  })

  return (
    <group ref={group} visible={false}>
      <lineSegments geometry={axis} material={axisMat} frustumCulled={false} />
      <lineSegments geometry={trail} material={trailMat} frustumCulled={false} />
      <lineSegments geometry={flipTick} material={flipMat} frustumCulled={false} />
      <lineSegments geometry={bracket} material={bracketMat} frustumCulled={false} />
      <points geometry={head} material={headMat} frustumCulled={false} />
    </group>
  )
}
