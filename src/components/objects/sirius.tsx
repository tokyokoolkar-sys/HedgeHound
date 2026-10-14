// Sirius alone (κ, DESIGN.md "Ledger"): when the ledger dims the sky, the one star left is α Canis Majoris,
// the Edition's home coordinate, centred above the closing lines. A crisp point (no bloom); its brightness
// follows scene.siriusOn, so it arrives and leaves with the scroll.
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { SIRIUS_AT } from "@/lib/stage/coordinates"
import { useStage } from "@/lib/stage/store"
import { SKY_COLORS } from "../stage/star-points"

const vert = /* glsl */ `
uniform float uPR; void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = 20.0 * uPR; }`
const frag = /* glsl */ `
uniform float uOpacity; uniform vec3 uColor;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d2 = dot(c, c);
  float a = min(1.0, exp(-d2 * 140.0) + exp(-d2 * 16.0) * 0.28) * smoothstep(0.5, 0.42, sqrt(d2)) * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(pow(uColor * a, vec3(2.2)), 1.0);
}`

export function Sirius() {
  const ref = useRef<THREE.Points>(null)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute(SIRIUS_AT, 3))
    return g
  }, [])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        // The same blue-white as α in Canis Major.
        uniforms: { uPR: { value: 1 }, uOpacity: { value: 0 }, uColor: { value: SKY_COLORS.star.clone().lerp(SKY_COLORS.cool, 0.35) } },
      }),
    [],
  )
  useEffect(() => () => geo.dispose(), [geo])
  useFrame(({ gl }) => {
    const on = useStage.getState().scene.siriusOn
    if (ref.current) ref.current.visible = on > 0.001
    mat.uniforms.uOpacity.value = on
    mat.uniforms.uPR.value = gl.getPixelRatio()
  })
  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} visible={false} />
}
