// The θ atlas (DESIGN.md "Atlas", PLAN §3 θ): every live coin as a star across the whole sky, each at a
// fixed spot from its symbol (lib/stage/atlas.ts). Brightness is net APR, orange is clean and paying, and
// the twinkle is measured shakiness (1 − persistence), the same rule as the kennel. As you scroll the camera
// pulls back from close-up to the whole field; the pull and the recede are scroll-locked.
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { smooth } from "@/lib/motion/math"
import { useScan } from "@/lib/scan/use-scan"
import { atlasFrame, placeAtlas } from "@/lib/stage/atlas"
import { useStage } from "@/lib/stage/store"
import { SKY_COLORS } from "../stage/star-points"

const vert = /* glsl */ `
uniform float uPR, uTime;
attribute float aSize; attribute vec3 aColor; attribute float aShake; attribute float aPhase;
varying vec3 vColor; varying float vA;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPR;
  float f = 1.2 + aShake * 7.0;
  vA = 1.0 - aShake * 0.75 * (0.5 + 0.5 * sin(uTime * f + aPhase * 40.0));
  vColor = aColor;
}`

const frag = /* glsl */ `
uniform float uOpacity; varying vec3 vColor; varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d2 = dot(c, c);
  float a = min(1.0, exp(-d2 * 120.0) + exp(-d2 * 14.0) * 0.3) * smoothstep(0.5, 0.42, sqrt(d2)) * uOpacity * vA;
  if (a < 0.004) discard;
  gl_FragColor = vec4(pow(vColor * a, vec3(2.2)), 1.0);
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
    const dim = SKY_COLORS.star.clone().multiplyScalar(0.75)
    const loss = SKY_COLORS.star.clone().multiplyScalar(0.4)
    stars.forEach((k, i) => {
      pos.set([k.x, k.y, 0], i * 3)
      const c = k.net <= 0 ? loss : k.ok ? SKY_COLORS.scent : dim
      col.set([c.r, c.g, c.b], i * 3)
      sz[i] = k.size
      shake[i] = k.shake
      phase[i] = (i * 0.618) % 1
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3))
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1))
    g.setAttribute("aShake", new THREE.BufferAttribute(shake, 1))
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1))
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
        uniforms: { uPR: { value: 1 }, uTime: { value: 0 }, uOpacity: { value: 0 } },
      }),
    [],
  )

  useEffect(() => () => geo.dispose(), [geo])
  useEffect(
    () => () => {
      atlasFrame.visible = false
      atlasFrame.matrix = null
    },
    [],
  )

  useFrame(({ clock, gl }) => {
    const s = useStage.getState()
    const sc = s.scene
    const g = group.current
    if (!g) return
    g.visible = sc.atlasOn > 0.5 && stars.length > 0
    atlasFrame.visible = g.visible
    if (!g.visible) return
    // The camera pulls back: the field starts magnified around its centre and settles to fill the view.
    const k = 1 + (1 - smooth(sc.atlasPull)) * 1.6
    const away = smooth(sc.atlasAway)
    const halfW = HALF_H * (size.width / size.height)
    g.scale.set(halfW * k, HALF_H * k, 1)
    g.position.set(0, 0, -away * 8)
    g.updateMatrixWorld()
    atlasFrame.matrix = g.matrixWorld.elements
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
