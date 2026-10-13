// The glass hound (DESIGN.md signature component). Clear crystal on black: nearly invisible body, a soft
// fresnel rim, stars bent through the glass with only a hint of dispersion, one highlight that follows
// the cursor. It never animates by itself. `scene.houndAway` (0..1) sends it into depth exponentially.
// The silhouette is still the draft mark from S4 and needs proper art.
import { useFrame, useThree } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import { SVGLoader } from "three-stdlib"
import { band, recedeDepth } from "@/lib/motion/math"
import { useStage, type Quality } from "@/lib/stage/store"
import { SKY_COLORS } from "../stage/star-points"

const HOUND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M10 60C11 50 14 41 18.5 35.5 20.8 32.6 20.2 29.6 19.2 26.4 18.2 21.5 19.4 15.4 22.6 8.6 23.2 7.2 24.2 6.8 25 7.6 28.6 11.2 30.8 16.2 31.6 21.4 32 24 33.4 25.4 35.8 26.2 38.4 27 40.4 28.4 43.4 29.2L54 31.6C57.4 32.4 59.4 33.8 59.4 36 59.4 38.4 57.4 39.6 54.6 39.8L48.6 40.2C45.4 40.6 43.4 42 42.6 44.4 41.8 47.4 42 51 42.6 54.2 43.2 57 44.2 59 45.8 60Z"/></svg>`

// PLAN §7: curve segments per tier.
const SEGMENTS: Record<Quality, { curve: number; bevel: number }> = {
  high: { curve: 72, bevel: 24 },
  mid: { curve: 40, bevel: 14 },
  low: { curve: 24, bevel: 8 },
}

function useHoundGeometry(quality: Quality) {
  const geo = useMemo(() => {
    const data = new SVGLoader().parse(HOUND_SVG)
    const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p as unknown as Parameters<typeof SVGLoader.createShapes>[0]))
    // Deep, soft bevel so every edge reads as rounded glass rather than a cut-out.
    const g = new THREE.ExtrudeGeometry(shapes, {
      depth: 4,
      bevelEnabled: true,
      bevelThickness: 4.2,
      bevelSize: 2.6,
      bevelSegments: SEGMENTS[quality].bevel,
      curveSegments: SEGMENTS[quality].curve,
    })
    g.center()
    g.scale(0.062, -0.062, 0.062)
    g.computeVertexNormals()
    return g
  }, [quality])
  return geo
}

const vert = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec4 vClip;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  vClip = projectionMatrix * mv;
  gl_Position = vClip;
}`

const frag = /* glsl */ `
uniform float uO;
uniform vec2 uLight;
uniform vec3 uRim, uStar;
varying vec3 vN; varying vec3 vV; varying vec4 vClip;
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float stars(vec2 uv) {
  vec2 g = uv * 60.0; vec2 i = floor(g); vec2 f = fract(g) - 0.5;
  float h = hash(i);
  vec2 o = vec2(hash(i + 3.1), hash(i + 7.7)) - 0.5;
  float d = length(f - o * 0.7);
  return step(0.9, h) * exp(-d * d * 200.0) * (0.5 + h);
}
void main() {
  vec3 n = normalize(vN); vec3 v = normalize(vV);
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fr = pow(1.0 - ndv, 2.0);
  vec2 suv = vClip.xy / vClip.w * 0.5 + 0.5;
  vec2 bend = n.xy * (0.06 + fr * 0.08);
  vec3 seen = vec3(stars(suv + bend * 1.05), stars(suv + bend), stars(suv + bend * 0.95)) * uStar * 1.5;
  seen = mix(seen, vec3(dot(seen, vec3(0.333))), 0.65); // a hint of dispersion, mostly clear
  vec3 rim = uRim * (fr * 1.5 + pow(fr, 4.0) * 1.6) + uRim * smoothstep(0.35, 0.9, fr) * 0.25;
  vec3 l = normalize(vec3(uLight * 0.9, 0.75));
  float spec = pow(max(dot(reflect(-l, n), v), 0.0), 120.0) * 1.6;
  float sheen = pow(max(dot(reflect(-l, n), v), 0.0), 8.0) * 0.08;
  vec3 col = seen * (0.4 + 0.6 * (1.0 - fr)) + rim + vec3(spec + sheen);
  float a = clamp(0.1 + fr * 0.85 + spec + length(seen) * 0.4, 0.0, 1.0) * uO;
  gl_FragColor = vec4(pow(max(col, vec3(0.0)), vec3(2.2)), a);
}`

export function GlassHound({ quality }: { quality: Quality }) {
  const geo = useHoundGeometry(quality)
  const ref = useRef<THREE.Group>(null)
  const { size } = useThree()
  const glass = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uO: { value: 1 },
          uLight: { value: new THREE.Vector2(0.3, 0.5) },
          uRim: { value: SKY_COLORS.star.clone().lerp(SKY_COLORS.cool, 0.25) },
          uStar: { value: SKY_COLORS.star.clone() },
        },
      }),
    [],
  )

  useFrame((_, dt) => {
    const s = useStage.getState()
    const g = ref.current
    if (!g) return
    const away = s.scene.houndAway
    const depth = recedeDepth(away)
    const o = 1 - band(away, 0.78, 1)
    g.visible = o > 0.001
    if (!g.visible) return
    const px = s.reduced ? 0 : s.pointer[0]
    const py = s.reduced ? 0 : s.pointer[1]
    const narrow = size.width < 768
    g.position.set(0, (narrow ? 1.2 : 0.85) + depth * 0.6, -depth * 60)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -0.32 + px * 0.22, 2.2, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.08 - py * 0.14, 2.2, dt)
    // Phones: smaller so the hound sits above the title instead of filling the width.
    g.scale.setScalar(narrow ? 0.5 : 0.8)
    const u = glass.uniforms.uLight.value as THREE.Vector2
    u.set(THREE.MathUtils.damp(u.x, 0.3 + px * 0.8, 3, dt), THREE.MathUtils.damp(u.y, 0.5 + py * 0.6, 3, dt))
    glass.uniforms.uO.value = o
  })

  return (
    <group ref={ref}>
      <mesh geometry={geo}>
        <primitive object={glass} attach="material" />
      </mesh>
    </group>
  )
}
