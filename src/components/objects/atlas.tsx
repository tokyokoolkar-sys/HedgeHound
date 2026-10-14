// The θ atlas (DESIGN.md "Atlas", PLAN §3 θ): every live coin as a star across the whole sky, each at a
// fixed spot from its symbol (lib/stage/atlas.ts). Brightness is net APR, orange is clean and paying, and
// the twinkle is measured shakiness (1 − persistence), the same rule as the kennel. As you scroll the camera
// pulls back from close-up to the whole field; the pull and the recede are scroll-locked.
// On /sky (T33) the same field takes a focus: "reading" eases toward a coin, "fly" travels into the field with
// every coin at its own depth (projected to the same spot at rest, so θ and /sky match). It publishes each
// coin's world and screen point for /sky's labels and hit-testing.
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { smooth } from "@/lib/motion/math"
import { useScan } from "@/lib/scan/use-scan"
import { CAM_Z, atlasFrame, atlasLocal, atlasScreen, atlasWorld, depthOf, focusTarget, focusTransform, placeAtlas } from "@/lib/stage/atlas"
import { useStage } from "@/lib/stage/store"
import { SKY_COLORS } from "../stage/star-points"

const vert = /* glsl */ `
uniform float uPR, uTime, uDepth, uCam, uOff;
attribute float aSize; attribute vec3 aColor; attribute float aShake; attribute float aPhase; attribute float aZ;
varying vec3 vColor; varying float vA;
void main() {
  // At depth z, the local spot shrinks by (cam − z) / cam toward the field's centre (uOff, local units) so it
  // projects where the flat field put it (lib/stage/atlas.ts atlasLocal).
  float z = aZ * uDepth;
  float m = (uCam - z) / uCam;
  vec4 mv = modelViewMatrix * vec4(position.x * m + uOff * (m - 1.0), position.y * m, z, 1.0);
  float dist = -mv.z;
  gl_Position = projectionMatrix * mv;
  // Nearer than at rest grows the point a little (crisp, capped); anything at or behind the lens vanishes.
  float grow = clamp((uCam - z) / max(dist, 0.001), 0.0, 2.2);
  gl_PointSize = dist < 0.4 ? 0.0 : aSize * uPR * grow;
  float f = 1.2 + aShake * 7.0;
  vA = (1.0 - aShake * 0.75 * (0.5 + 0.5 * sin(uTime * f + aPhase * 40.0))) * smoothstep(0.6, 1.8, dist);
  vColor = aColor;
}`

const frag = /* glsl */ `
uniform float uOpacity, uClip; varying vec3 vColor; varying float vA;
void main() {
  // /sky: coins never pass under the list column (its right edge, device px); a short fade, not a hard cut.
  float clip = smoothstep(uClip - 24.0, uClip, gl_FragCoord.x);
  vec2 c = gl_PointCoord - 0.5; float d2 = dot(c, c);
  float a = min(1.0, exp(-d2 * 120.0) + exp(-d2 * 14.0) * 0.3) * smoothstep(0.5, 0.42, sqrt(d2)) * uOpacity * vA * clip;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * pow(a, 2.2), 1.0);
}`

/** Half the visible height at z = 0 for the default camera (z 10, fov 45). */
const HALF_H = 10 * Math.tan((45 / 2) * (Math.PI / 180))

export function Atlas() {
  const { size } = useThree()
  const scan = useScan()
  const stars = useMemo(() => placeAtlas(scan.rows), [scan.rows])
  const group = useRef<THREE.Group>(null)

  const geo = useMemo(() => {
    const n = stars.length
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    const sz = new Float32Array(n)
    const shake = new Float32Array(n)
    const phase = new Float32Array(n)
    const depth = new Float32Array(n)
    const dim = SKY_COLORS.star.clone().multiplyScalar(0.75)
    const loss = SKY_COLORS.star.clone().multiplyScalar(0.4)
    stars.forEach((k, i) => {
      pos.set([k.x, k.y, 0], i * 3)
      const c = k.net <= 0 ? loss : k.ok ? SKY_COLORS.scent : dim
      col.set([c.r, c.g, c.b], i * 3)
      sz[i] = k.size
      shake[i] = k.shake
      phase[i] = (i * 0.618) % 1
      depth[i] = depthOf(k.symbol)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3))
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1))
    g.setAttribute("aShake", new THREE.BufferAttribute(shake, 1))
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1))
    g.setAttribute("aZ", new THREE.BufferAttribute(depth, 1))
    return g
  }, [stars])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uPR: { value: 1 }, uTime: { value: 0 }, uOpacity: { value: 0 }, uDepth: { value: 0 }, uCam: { value: CAM_Z }, uOff: { value: 0 }, uClip: { value: -100 } },
      }),
    [],
  )

  useEffect(() => () => geo.dispose(), [geo])
  useEffect(
    () => () => {
      atlasFrame.visible = false
      atlasFrame.matrix = null
      atlasWorld.clear()
      atlasScreen.clear()
    },
    [],
  )

  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ clock, gl, camera }) => {
    const s = useStage.getState()
    const sc = s.scene
    const g = group.current
    if (!g) return
    g.visible = sc.atlasOn > 0.5 && stars.length > 0
    atlasFrame.visible = g.visible
    if (!g.visible) {
      atlasWorld.clear()
      atlasScreen.clear()
      return
    }
    // The camera pulls back: the field starts magnified around its centre and settles to fill the view.
    const k = 1 + (1 - smooth(sc.atlasPull)) * 1.6
    const away = smooth(sc.atlasAway)
    const halfW = HALF_H * (size.width / size.height)
    const D = sc.atlasDepth
    const t = focusTransform({
      k0: k,
      halfW,
      halfH: HALF_H,
      inset: sc.atlasInset,
      f: sc.atlasFocus,
      fly: sc.atlasFly,
      fx: sc.atlasFx,
      fy: sc.atlasFy,
      fz: sc.atlasFz * D,
      target: focusTarget(size.width, size.height),
    })
    g.scale.set(t.scale[0], t.scale[1], 1)
    g.position.set(t.pos[0], t.pos[1], t.pos[2] - away * 8)
    g.updateMatrixWorld()
    atlasFrame.matrix = g.matrixWorld.elements
    // Each coin's world point (depth included) and where it lands on screen.
    for (const k2 of stars) {
      const z = depthOf(k2.symbol) * D
      const [lx, ly] = atlasLocal(k2.x, k2.y, z, t.scale[0], t.cx)
      v.set(lx, ly, z).applyMatrix4(g.matrixWorld)
      atlasWorld.set(k2.symbol, [v.x, v.y, v.z])
      const dist = camera.position.z - v.z
      v.project(camera)
      if (dist < 0.4 || v.z > 1 || (sc.atlasInset > 0 && (v.x * 0.5 + 0.5) * size.width < sc.atlasInset * size.width - 24)) atlasScreen.delete(k2.symbol)
      else atlasScreen.set(k2.symbol, [(v.x * 0.5 + 0.5) * size.width, (-v.y * 0.5 + 0.5) * size.height])
    }
    mat.uniforms.uDepth.value = D
    mat.uniforms.uOff.value = t.cx / t.scale[0]
    // The list column's edge, from the same inset that moves the field beside it (0 = no clip).
    mat.uniforms.uClip.value = sc.atlasInset > 0 ? (sc.atlasInset * size.width - 24) * gl.getPixelRatio() : -100
    mat.uniforms.uOpacity.value = sc.atlasAppear * (1 - away)
    mat.uniforms.uTime.value = s.reduced ? 0 : clock.elapsedTime
    mat.uniforms.uPR.value = gl.getPixelRatio()
  })

  return (
    <group ref={group} visible={false}>
      <points geometry={geo} material={mat} frustumCulled={false} />
    </group>
  )
}
