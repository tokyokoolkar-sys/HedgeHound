// The β radar (DESIGN.md "Radar", PLAN §3 β), ported from D1. Every axis means something
// (lib/stage/radar.ts): the half is the short venue, the radius is signed net APR with the outer ring at
// break-even, and alerting coins are scent orange; spreads that lose after costs sit outside, dimmed.
// A cyan sweep turns and pings each coin as it passes: that sweep is the chapter's one piece of ambient
// life. Arrival, labels, the reading's leader line and the recede are scroll-locked (scene channels).
// The radar publishes its transform to `radarFrame`, so the page's projected labels pin to it exactly.
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { band, smooth } from "@/lib/motion/math"
import { R_OUT, dockFor, layoutToWorld, mixLayout, radarFrame, radarLayout, tucked } from "@/lib/stage/radar"
import { useStage } from "@/lib/stage/store"
import { SKY_COLORS } from "../stage/star-points"
import { useRadar } from "./use-radar"

const pointVert = /* glsl */ `
uniform float uPR, uSweep;
attribute float aSize; attribute vec3 aColor; attribute float aAngle;
varying vec3 vColor; varying float vPing;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  float diff = mod(uSweep - aAngle, 6.2831853);
  vPing = exp(-diff * 2.6);
  vColor = aColor;
  gl_PointSize = aSize * uPR * (1.0 + vPing * 1.4);
}`

// A crisp core, a small halo that dies inside the sprite, and a thin ping ring right after the sweep passes.
const pointFrag = /* glsl */ `
uniform float uOpacity; varying vec3 vColor; varying float vPing;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d2 = dot(c, c);
  float a = (exp(-d2 * 120.0) + exp(-d2 * 14.0) * 0.3) * (0.45 + vPing * 0.9) * smoothstep(0.5, 0.42, sqrt(d2));
  a += smoothstep(0.02, 0.0, abs(sqrt(d2) - 0.38)) * vPing * 0.8;
  a = min(a, 1.0) * uOpacity;                          // no overdrive: scent stays #ff8a3d, never red
  if (a < 0.004) discard;
  gl_FragColor = vec4(pow(max(vColor * a, vec3(0.0)), vec3(2.2)), 1.0);
}`

const SWEEP_ARC = 1.1

const sweepFrag = /* glsl */ `
uniform float uO; uniform vec3 uC; varying vec2 vP;
void main() {
  float ang = atan(vP.y, vP.x);                       // the sector spans 0..ARC, leading edge at 0
  float lead = 1.0 - clamp(ang / ${SWEEP_ARC.toFixed(2)}, 0.0, 1.0);
  float r = length(vP) / ${R_OUT.toFixed(2)};
  float a = pow(lead, 3.0) * 0.14 * smoothstep(1.0, 0.85, r);
  a += smoothstep(0.012, 0.0, abs(ang)) * 0.32 * smoothstep(1.0, 0.96, r);
  a *= uO;
  gl_FragColor = vec4(pow(max(uC * a, vec3(0.0)), vec3(2.2)), 1.0);
}`

function ringGeometry() {
  const pts: number[] = []
  for (const r of [1.2, 2.4, R_OUT]) {
    for (let i = 0; i < 160; i++) {
      const a0 = (i / 160) * Math.PI * 2
      const a1 = ((i + 1) / 160) * Math.PI * 2
      pts.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0)
    }
  }
  // Bearing ticks: a long one every 30°, short ones every 5°.
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2
    const l = i % 6 === 0 ? 0.22 : 0.09
    pts.push(Math.cos(a) * R_OUT, Math.sin(a) * R_OUT, 0, Math.cos(a) * (R_OUT + l), Math.sin(a) * (R_OUT + l), 0)
  }
  pts.push(-R_OUT, 0, 0, R_OUT, 0, 0, 0, -R_OUT, 0, 0, R_OUT, 0)
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3))
  return g
}

export function Radar() {
  const { size } = useThree()
  const { placed, anchor } = useRadar()
  const group = useRef<THREE.Group>(null)
  const sweep = useRef<THREE.Mesh>(null)

  const rings = useMemo(ringGeometry, [])
  const ringMat = useMemo(() => new THREE.LineBasicMaterial({ color: SKY_COLORS.line, transparent: true, opacity: 0, depthWrite: false }), [])

  const points = useMemo(() => {
    const n = placed.length
    const p = new Float32Array(n * 3)
    const s = new Float32Array(n)
    const c = new Float32Array(n * 3)
    const an = new Float32Array(n)
    const dim = SKY_COLORS.star.clone().multiplyScalar(0.8)
    const loss = SKY_COLORS.star.clone().multiplyScalar(0.4)
    placed.forEach((k, i) => {
      p.set([k.x, k.y, 0], i * 3)
      s[i] = k.net > 0 ? 5 + Math.min(1, k.net / 60) * 9 : 4
      const col = k.net <= 0 ? loss : k.ok ? SKY_COLORS.scent : dim
      c.set([col.r, col.g, col.b], i * 3)
      an[i] = k.a
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(p, 3))
    g.setAttribute("aSize", new THREE.BufferAttribute(s, 1))
    g.setAttribute("aColor", new THREE.BufferAttribute(c, 3))
    g.setAttribute("aAngle", new THREE.BufferAttribute(an, 1))
    return g
  }, [placed])
  useEffect(() => () => points.dispose(), [points])
  const pointMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: pointVert,
        fragmentShader: pointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uPR: { value: 1 }, uSweep: { value: 0 }, uOpacity: { value: 0 } },
      }),
    [],
  )

  const sweepMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uO: { value: 0 }, uC: { value: SKY_COLORS.scan.clone() } },
        vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: sweepFrag,
      }),
    [],
  )

  const leader = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3))
    return g
  }, [])
  const leaderMat = useMemo(() => new THREE.LineBasicMaterial({ color: SKY_COLORS.star, transparent: true, opacity: 0, depthWrite: false }), [])

  useEffect(
    () => () => {
      radarFrame.visible = false
      radarFrame.matrix = null
    },
    [],
  )

  useFrame(({ clock, gl }) => {
    const s = useStage.getState()
    const sc = s.scene
    const g = group.current
    if (!g) return
    g.visible = sc.radarOn > 0.5
    radarFrame.visible = g.visible
    if (!g.visible) return
    const layout = radarLayout(size.width, size.height)
    // Stacked layouts: tucked under the copy, then featured on its own (scene.radarFocus).
    const placedLayout = layout.mode === "narrow" ? mixLayout(tucked(layout, size.height), layout, smooth(sc.radarFocus)) : layout
    const at = layoutToWorld(placedLayout, size.width, size.height)
    const appear = sc.radarAppear
    const away = smooth(sc.radarAway)
    const px = s.reduced ? 0 : s.pointer[0]
    const py = s.reduced ? 0 : s.pointer[1]
    // Placed beside (or under) the copy column for this viewport; it grows into place as it arrives.
    g.scale.setScalar(at.scale * (0.77 + 0.23 * appear))
    g.rotation.set(-0.18 + py * 0.05, px * 0.08, away * 0.1)
    g.position.set(at.x, at.y, -2 + appear * 2 - away * 8)
    g.updateMatrixWorld()
    radarFrame.matrix = g.matrixWorld.elements

    const fade = appear * (1 - away)
    const turn = s.reduced ? 0.6 : -clock.elapsedTime * 0.85
    const wrapped = ((turn % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    if (sweep.current) sweep.current.rotation.z = wrapped
    pointMat.uniforms.uSweep.value = wrapped
    pointMat.uniforms.uPR.value = gl.getPixelRatio()
    pointMat.uniforms.uOpacity.value = fade
    ringMat.opacity = 0.22 * fade
    sweepMat.uniforms.uO.value = (s.reduced ? 0.6 : 1) * fade

    // The reading: the leader draws out from the coin over the first 30%, then the text gathers (page DOM).
    if (anchor) {
      const [dx, dy] = dockFor(anchor, layout.dock)
      const t = smooth(band(sc.reading, 0, 0.3))
      const arr = leader.attributes.position.array as Float32Array
      arr.set([anchor.x, anchor.y, 0, anchor.x + (dx - anchor.x) * t, anchor.y + (dy - anchor.y) * t, 0])
      leader.attributes.position.needsUpdate = true
      leaderMat.opacity = t > 0 ? 0.45 * (1 - away) : 0
    }
  })

  return (
    <group ref={group} visible={false}>
      <lineSegments geometry={rings} material={ringMat} />
      <mesh ref={sweep} material={sweepMat}>
        <circleGeometry args={[R_OUT, 64, 0, SWEEP_ARC]} />
      </mesh>
      <points geometry={points} material={pointMat} frustumCulled={false} />
      {anchor && <lineSegments geometry={leader} material={leaderMat} frustumCulled={false} />}
    </group>
  )
}
