// Direction spike D1 "Almagest": the whole 3D sky for the prototype route (throwaway).
// One canvas: far star shell, parallax flight layers, the glass hound, Canis Major, the radar,
// and a post stack (bloom, the pixel-grain crawl, film grain, vignette).
import { Html } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { EffectComposer, Noise, Vignette } from "@react-three/postprocessing"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { SVGLoader } from "three-stdlib"
import { SourceTag } from "@/components/edition/source-tag"
import { CMA, CMA_LINES, magToPx, project } from "./canis-major"
import { applyResolve } from "./pixel-mask"
import { CrawlEffect } from "./transition-effect"
import { SKY, band, smooth, useSky } from "./state"

type Portal = React.MutableRefObject<HTMLElement>

export type RadarCoin = { symbol: string; net: number; status: "ok" | "building history" }
export type Reading = { symbol: string; net: number; ok: boolean; live: boolean; ts?: number; stale: boolean }

// ---------------------------------------------------------------- star shader

const starVert = /* glsl */ `
uniform float uTime, uPR, uForm, uPersp, uFlight, uWrap, uZMin, uZRange, uSpread;
attribute float aSize; attribute vec3 aColor; attribute float aPhase; attribute vec3 aStart; attribute float aDelay;
varying vec3 vColor; varying float vA;
void main() {
  float t = clamp((uForm - aDelay) / 0.42, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(aStart, position, t);
  if (uWrap > 0.5) p.z = mod(p.z + uFlight - uZMin, uZRange) + uZMin;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.78 + 0.22 * sin(uTime * (0.6 + aPhase * 2.1) + aPhase * 61.0);
  float att = uPersp > 0.5 ? 10.0 / max(0.5, -mv.z) : 1.0;
  gl_PointSize = max(1.0, aSize * uPR * att * uSpread);
  // Fade wrapped layers in from depth and out before they reach the lens.
  float depthFade = uWrap > 0.5 ? smoothstep(uZMin, uZMin + 8.0, p.z) * (1.0 - smoothstep(6.0, 9.5, p.z)) : 1.0;
  vColor = aColor;
  vA = tw * smoothstep(0.0, 0.35, t) * depthFade;
}`

const starFrag = /* glsl */ `
uniform float uOpacity, uSoft, uSpread, uHalo;
varying vec3 vColor; varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c);
  // uSpread enlarges the sprite while keeping the core the same size, so the halo spreads wide and soft
  // (this replaces post bloom).
  float core = exp(-d2 * mix(140.0, 9.0, uSoft) * uSpread * uSpread);
  float halo = exp(-d2 * mix(18.0, 5.0, uSoft)) * mix(0.30, 0.55, uSoft) * uHalo;
  halo += exp(-d2 * 4.0) * 0.05 * step(1.01, uSpread);
  float a = (core + halo) * vA * uOpacity * smoothstep(0.5, 0.36, sqrt(d2));
  if (a < 0.004) discard;
  gl_FragColor = vec4(pow(max(vColor * a, vec3(0.0)), vec3(2.2)), 1.0);
}`

function starMaterial(o: { persp?: boolean; soft?: number; wrap?: [number, number]; spread?: number; halo?: number } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: starVert,
    fragmentShader: starFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPR: { value: 1 },
      uForm: { value: 1 },
      uPersp: { value: o.persp ? 1 : 0 },
      uFlight: { value: 0 },
      uWrap: { value: o.wrap ? 1 : 0 },
      uZMin: { value: o.wrap ? o.wrap[0] : 0 },
      uZRange: { value: o.wrap ? o.wrap[1] - o.wrap[0] : 1 },
      uOpacity: { value: 1 },
      uSoft: { value: o.soft ?? 0 },
      uSpread: { value: o.spread ?? 1 },
      uHalo: { value: o.halo ?? 1 },
    },
  })
}

const C = {
  star: new THREE.Color(SKY.starlight),
  cool: new THREE.Color(SKY.coolStar),
  warm: new THREE.Color(SKY.warmStar),
  cyan: new THREE.Color(SKY.cyan),
  orange: new THREE.Color(SKY.orange),
  line: new THREE.Color(SKY.line),
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function starColor(r: number) {
  return r < 0.55 ? C.star.clone().lerp(C.cool, r / 0.55 * 0.8) : C.star.clone().lerp(C.warm, (r - 0.55) / 0.45 * 0.7)
}

type Field = { position: Float32Array; aStart: Float32Array; aSize: Float32Array; aColor: Float32Array; aPhase: Float32Array; aDelay: Float32Array }

function makeField(n: number, seed: number, place: (r: () => number, i: number) => { p: [number, number, number]; size: number }): Field {
  const r = rng(seed)
  const f: Field = {
    position: new Float32Array(n * 3),
    aStart: new Float32Array(n * 3),
    aSize: new Float32Array(n),
    aColor: new Float32Array(n * 3),
    aPhase: new Float32Array(n),
    aDelay: new Float32Array(n),
  }
  for (let i = 0; i < n; i++) {
    const { p, size } = place(r, i)
    f.position.set(p, i * 3)
    f.aStart.set(p, i * 3)
    f.aSize[i] = size
    const c = starColor(r())
    f.aColor.set([c.r, c.g, c.b], i * 3)
    f.aPhase[i] = r()
  }
  return f
}

function FieldPoints({ field, material }: { field: Field; material: THREE.ShaderMaterial }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(field.position, 3))
    g.setAttribute("aStart", new THREE.BufferAttribute(field.aStart, 3))
    g.setAttribute("aSize", new THREE.BufferAttribute(field.aSize, 1))
    g.setAttribute("aColor", new THREE.BufferAttribute(field.aColor, 3))
    g.setAttribute("aPhase", new THREE.BufferAttribute(field.aPhase, 1))
    g.setAttribute("aDelay", new THREE.BufferAttribute(field.aDelay, 1))
    return g
  }, [field])
  useEffect(() => () => geo.dispose(), [geo])
  return <points geometry={geo} material={material} frustumCulled={false} />
}

// ---------------------------------------------------------------- layers

function DeepSky() {
  const mobile = useSky.getState().mobile
  const shell = useMemo(
    () =>
      makeField(mobile ? 2600 : 6500, 7, (r) => {
        const u = r() * 2 - 1
        const th = r() * Math.PI * 2
        const rad = 70 + r() * 70
        const s = Math.sqrt(1 - u * u)
        const bright = r() < 0.025
        return { p: [rad * s * Math.cos(th), rad * u, rad * s * Math.sin(th) - 20], size: bright ? 2.6 + r() * 2.2 : 0.7 + Math.pow(r(), 3) * 1.8 }
      }),
    [mobile],
  )
  const flight = useMemo(
    () =>
      makeField(mobile ? 500 : 1400, 11, (r) => ({ p: [(r() - 0.5) * 60, (r() - 0.5) * 40, -60 + r() * 70], size: 1.0 + r() * 1.6 })),
    [mobile],
  )
  const dust = useMemo(
    () => makeField(mobile ? 90 : 220, 23, (r) => ({ p: [(r() - 0.5) * 26, (r() - 0.5) * 16, -40 + r() * 50], size: 2.2 + r() * 4.5 })),
    [mobile],
  )
  const shellMat = useMemo(() => starMaterial(), [])
  const flightMat = useMemo(() => starMaterial({ persp: true, wrap: [-60, 10] }), [])
  const dustMat = useMemo(() => starMaterial({ persp: true, soft: 1, wrap: [-40, 10] }), [])
  const shellRef = useRef<THREE.Group>(null)

  useFrame(({ clock, gl }) => {
    const s = useSky.getState()
    const t = clock.elapsedTime
    const fly = s.reduced ? 0 : s.hero * 6 + s.alpha * 10 + s.crawl * 18 + s.beta * 10
    for (const m of [shellMat, flightMat, dustMat]) {
      m.uniforms.uTime.value = s.reduced ? 0 : t
      m.uniforms.uPR.value = gl.getPixelRatio()
      m.uniforms.uFlight.value = fly
    }
    dustMat.uniforms.uOpacity.value = 0.55
    if (shellRef.current) {
      shellRef.current.rotation.y = fly * 0.004 + s.pointer[0] * 0.02
      shellRef.current.rotation.x = s.pointer[1] * 0.012
    }
  })

  return (
    <>
      <group ref={shellRef}>
        <FieldPoints field={shell} material={shellMat} />
      </group>
      <FieldPoints field={flight} material={flightMat} />
      <FieldPoints field={dust} material={dustMat} />
    </>
  )
}

// ---------------------------------------------------------------- glass hound

const HOUND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M10 60C11 50 14 41 18.5 35.5 20.8 32.6 20.2 29.6 19.2 26.4 18.2 21.5 19.4 15.4 22.6 8.6 23.2 7.2 24.2 6.8 25 7.6 28.6 11.2 30.8 16.2 31.6 21.4 32 24 33.4 25.4 35.8 26.2 38.4 27 40.4 28.4 43.4 29.2L54 31.6C57.4 32.4 59.4 33.8 59.4 36 59.4 38.4 57.4 39.6 54.6 39.8L48.6 40.2C45.4 40.6 43.4 42 42.6 44.4 41.8 47.4 42 51 42.6 54.2 43.2 57 44.2 59 45.8 60Z"/></svg>`

function useHoundGeometry() {
  return useMemo(() => {
    const data = new SVGLoader().parse(HOUND_SVG)
    const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p as unknown as Parameters<typeof SVGLoader.createShapes>[0]))
    // Deep, soft bevel so every edge reads as rounded glass rather than a cut-out.
    const g = new THREE.ExtrudeGeometry(shapes, {
      depth: 4,
      bevelEnabled: true,
      bevelThickness: 4.2,
      bevelSize: 2.6,
      bevelSegments: 24,
      curveSegments: 72,
    })
    g.center()
    g.scale(0.062, -0.062, 0.062)
    g.computeVertexNormals()
    return g
  }, [])
}

const glassVert = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec4 vClip; varying vec3 vObj;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  vObj = position;
  vClip = projectionMatrix * mv;
  gl_Position = vClip;
}`

// Clear crystal on black: an almost-invisible body, a soft wide fresnel glow, stars seen through the
// glass and bent strongly by the surface (with a chromatic split), and one highlight that follows the
// cursor. No clock: it only changes when the pointer moves.
const glassFrag = /* glsl */ `
uniform float uO;
uniform vec2 uLight;
uniform vec3 uRim, uStar;
varying vec3 vN; varying vec3 vV; varying vec4 vClip; varying vec3 vObj;
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

function GlassHound() {
  const geo = useHoundGeometry()
  const ref = useRef<THREE.Group>(null)
  const glass = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glassVert,
        fragmentShader: glassFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uO: { value: 1 },
          uLight: { value: new THREE.Vector2(0.3, 0.5) },
          uRim: { value: C.star.clone().lerp(C.cool, 0.25) },
          uStar: { value: C.star.clone() },
        },
      }),
    [],
  )
  useFrame((_, dt) => {
    const s = useSky.getState()
    const g = ref.current
    if (!g) return
    // Exponential recede: slow at first, then faster and smaller as it falls into depth.
    const away = s.reduced ? 0 : band(s.hero, 0.12, 1)
    const depth = (Math.exp(away * 4.4) - 1) / (Math.exp(4.4) - 1)
    const o = 1 - band(away, 0.78, 1)
    g.visible = o > 0.001
    g.position.set(0, 0.85 + depth * 0.6, -depth * 60)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -0.32 + s.pointer[0] * 0.22, 2.2, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.08 - s.pointer[1] * 0.14, 2.2, dt)
    g.scale.setScalar(0.8)
    const u = glass.uniforms.uLight.value as THREE.Vector2
    u.set(THREE.MathUtils.damp(u.x, 0.3 + s.pointer[0] * 0.8, 3, dt), THREE.MathUtils.damp(u.y, 0.5 + s.pointer[1] * 0.6, 3, dt))
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

// ---------------------------------------------------------------- Canis Major

function CanisMajor({ portal }: { portal: Portal }) {
  const group = useRef<THREE.Group>(null)
  const labels = useRef<Array<HTMLDivElement | null>>([])
  const pos = useMemo(() => new Map(CMA.map((s) => [s.key, project(s)])), [])
  const order = useMemo(() => [...CMA].sort((a, b) => a.mag - b.mag).map((s) => s.key), [])

  const field = useMemo<Field>(() => {
    const n = CMA.length
    const r = rng(5)
    const f: Field = {
      position: new Float32Array(n * 3),
      aStart: new Float32Array(n * 3),
      aSize: new Float32Array(n),
      aColor: new Float32Array(n * 3),
      aPhase: new Float32Array(n),
      aDelay: new Float32Array(n),
    }
    CMA.forEach((s, i) => {
      const [x, y] = pos.get(s.key)!
      f.position.set([x, y, 0], i * 3)
      // Stars burst out of where the hound stood, then fly to their chart positions.
      f.aStart.set([(r() - 0.5) * 1.6, 0.4 + (r() - 0.5) * 1.6, -18 - r() * 10], i * 3)
      f.aSize[i] = magToPx(s.mag)
      const c = s.key === "alpha" ? C.star.clone().lerp(C.cool, 0.35) : starColor(r())
      f.aColor.set([c.r * 1.25, c.g * 1.25, c.b * 1.25], i * 3)
      f.aPhase[i] = r()
      f.aDelay[i] = (order.indexOf(s.key) / n) * 0.42
    })
    return f
  }, [pos, order])
  const mat = useMemo(() => starMaterial({ persp: true, spread: 1, halo: 0.35 }), [])

  // Lines are redrawn each frame; each segment draws in sequence after its stars arrive.
  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(CMA_LINES.length * 6), 3))
    return g
  }, [])
  const lineMat = useMemo(() => new THREE.LineBasicMaterial({ color: C.line, transparent: true, opacity: 0.42, depthWrite: false }), [])

  useFrame(({ clock, gl }) => {
    const s = useSky.getState()
    const g = group.current
    if (!g) return
    const form = s.reduced ? 1 : band(s.alpha, 0.0, 0.42) * 1.0 + band(s.hero, 0.55, 1) * 0.0
    const recede = s.reduced ? 0 : smooth(band(s.alpha, 0.78, 1)) * 0.6 + smooth(band(s.crawl, 0, 0.5)) * 0.4
    g.visible = s.hero > 0.5 && s.crawl < 0.5
    g.position.set((s.mobile ? 0 : 1.5) + s.pointer[0] * -0.15, (s.mobile ? 0.9 : 0.25) + s.pointer[1] * -0.1, -recede * 12)
    g.rotation.z = recede * 0.12
    g.scale.setScalar(s.mobile ? 0.62 : 1)
    mat.uniforms.uForm.value = form * 1.42
    mat.uniforms.uTime.value = s.reduced ? 0 : clock.elapsedTime
    mat.uniforms.uPR.value = gl.getPixelRatio()

    const arr = lineGeo.attributes.position.array as Float32Array
    const draw = s.reduced ? 1 : band(s.alpha, 0.22, 0.5)
    CMA_LINES.forEach(([a, b], i) => {
      const pa = pos.get(a)!
      const pb = pos.get(b)!
      const t = smooth(band(draw * CMA_LINES.length, i * 0.7, i * 0.7 + 1.6))
      arr.set([pa[0], pa[1], 0, pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, 0], i * 6)
    })
    lineGeo.attributes.position.needsUpdate = true

    const labelO = s.reduced ? 1 : band(s.alpha, 0.38, 0.5) * (1 - band(s.alpha, 0.8, 0.95))
    labels.current.forEach((el) => el && (el.style.opacity = String(labelO)))
  })

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeo} material={lineMat} />
      <FieldPoints field={field} material={mat} />
      {CMA.map((s, i) => {
        const [x, y] = pos.get(s.key)!
        return (
          <Html key={s.key} portal={portal} position={[x, y, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
            <div ref={(el) => void (labels.current[i] = el)} className="a-star-label" data-major={s.name ? "" : undefined}>
              <span className="a-bayer">{s.bayer}</span>
              {s.name && <span className="a-star-name">{s.name}</span>}
            </div>
          </Html>
        )
      })}
    </group>
  )
}

// ---------------------------------------------------------------- radar (β · Sniff)

const radarVert = /* glsl */ `
uniform float uTime, uPR, uSweep;
attribute float aSize; attribute vec3 aColor; attribute float aAngle;
varying vec3 vColor; varying float vPing;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float diff = mod(uSweep - aAngle, 6.2831853);
  float ping = exp(-diff * 2.6);
  vPing = ping;
  vColor = aColor;
  gl_PointSize = aSize * uPR * (1.0 + ping * 1.4);
}`
const radarFrag = /* glsl */ `
uniform float uOpacity; varying vec3 vColor; varying float vPing;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d2 = dot(c, c);
  float a = (exp(-d2 * 120.0) + exp(-d2 * 14.0) * 0.35) * (0.45 + vPing * 0.9) * uOpacity;
  float ring = smoothstep(0.02, 0.0, abs(sqrt(d2) - 0.38)) * vPing * 0.8 * uOpacity;
  a += ring;
  if (a < 0.004) discard;
  gl_FragColor = vec4(pow(max(vColor * a, vec3(0.0)), vec3(2.2)), 1.0);
}`

function hashAngle(sym: string) {
  let h = 2166136261
  for (let i = 0; i < sym.length; i++) h = Math.imul(h ^ sym.charCodeAt(i), 16777619)
  return ((h >>> 0) / 4294967296) * Math.PI * 2
}

const R_OUT = 3.6

function Radar({ coins, portal, reading }: { coins: RadarCoin[]; portal: Portal; reading: Reading | null }) {
  const callout = useRef<HTMLDivElement>(null)
  const group = useRef<THREE.Group>(null)
  const sweepRef = useRef<THREE.Mesh>(null)
  const labels = useRef<Array<HTMLDivElement | null>>([])

  const placed = useMemo(
    () =>
      coins.slice(0, 40).map((c) => {
        const a = hashAngle(c.symbol)
        const r = R_OUT - 2.8 * Math.min(1, Math.abs(c.net) / 60) - 0.25
        return { ...c, a, x: Math.cos(a) * r, y: Math.sin(a) * r }
      }),
    [coins],
  )
  const top = useMemo(
    () => [...placed].filter((k) => k.symbol !== reading?.symbol).sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 5),
    [placed, reading],
  )
  const anchor = useMemo(() => placed.find((k) => k.symbol === reading?.symbol) ?? null, [placed, reading])
  const mobile = useSky.getState().mobile
  // The reading sits outside the ring (right on desktop, below on mobile), joined to its coin by a leader.
  const dock = useMemo<[number, number]>(
    () => (anchor ? (mobile ? [0, -R_OUT - 0.5] : [R_OUT + 0.35, Math.max(-1.6, Math.min(1.6, anchor.y))]) : [0, 0]),
    [anchor, mobile],
  )
  const leader = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3))
    return g
  }, [])
  const leaderMat = useMemo(() => new THREE.LineBasicMaterial({ color: C.star, transparent: true, opacity: 0, depthWrite: false }), [])

  const pointGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const n = placed.length
    const p = new Float32Array(n * 3), s = new Float32Array(n), c = new Float32Array(n * 3), an = new Float32Array(n)
    placed.forEach((k, i) => {
      p.set([k.x, k.y, 0], i * 3)
      s[i] = 5 + Math.min(1, Math.abs(k.net) / 60) * 9
      const col = k.status === "ok" ? C.orange : C.star.clone().multiplyScalar(0.8)
      c.set([col.r, col.g, col.b], i * 3)
      an[i] = k.a
    })
    g.setAttribute("position", new THREE.BufferAttribute(p, 3))
    g.setAttribute("aSize", new THREE.BufferAttribute(s, 1))
    g.setAttribute("aColor", new THREE.BufferAttribute(c, 3))
    g.setAttribute("aAngle", new THREE.BufferAttribute(an, 1))
    return g
  }, [placed])
  const pointMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: radarVert,
        fragmentShader: radarFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uSweep: { value: 0 }, uOpacity: { value: 1 } },
      }),
    [],
  )

  const rings = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pts: number[] = []
    for (const r of [1.2, 2.4, R_OUT]) {
      for (let i = 0; i < 160; i++) {
        const a0 = (i / 160) * Math.PI * 2, a1 = ((i + 1) / 160) * Math.PI * 2
        pts.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0)
      }
    }
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2
      const l = i % 6 === 0 ? 0.22 : 0.09
      pts.push(Math.cos(a) * R_OUT, Math.sin(a) * R_OUT, 0, Math.cos(a) * (R_OUT + l), Math.sin(a) * (R_OUT + l), 0)
    }
    pts.push(-R_OUT, 0, 0, R_OUT, 0, 0, 0, -R_OUT, 0, 0, R_OUT, 0)
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])
  const ringMat = useMemo(() => new THREE.LineBasicMaterial({ color: C.line, transparent: true, opacity: 0.22, depthWrite: false }), [])

  const sweepMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uO: { value: 1 }, uC: { value: C.cyan.clone() } },
        vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uO; uniform vec3 uC; varying vec2 vP;
          void main(){
            float ang = atan(vP.y, vP.x); // sector spans 0..1.1 rad, leading edge at 0
            float lead = 1.0 - clamp(ang / 1.1, 0.0, 1.0);
            float r = length(vP) / ${R_OUT.toFixed(1)};
            float a = pow(lead, 3.0) * 0.16 * smoothstep(1.0, 0.85, r) * uO;
            a += smoothstep(0.012, 0.0, abs(ang)) * 0.35 * uO;
            gl_FragColor = vec4(pow(max(uC * a, vec3(0.0)), vec3(2.2)), 1.0);
          }`,
      }),
    [],
  )

  useFrame(({ clock, gl }) => {
    const s = useSky.getState()
    const g = group.current
    if (!g) return
    g.visible = s.crawl >= 0.5
    const appear = s.reduced ? 1 : smooth(band(s.crawl, 0.5, 1)) * 0.6 + smooth(band(s.beta, 0, 0.3)) * 0.4
    g.scale.setScalar((0.5 + appear * 0.2) * (useSky.getState().mobile ? 0.8 : 1))
    g.rotation.x = -0.18 + s.pointer[1] * 0.05
    g.rotation.y = s.pointer[0] * 0.08
    g.position.set(s.mobile ? 0 : 1.7, s.mobile ? 1.4 : -0.1, -2 + appear * 2 - band(s.beta, 0.85, 1) * 6)
    const sweep = s.reduced ? 0.6 : -clock.elapsedTime * 0.85
    const wrapped = ((sweep % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    if (sweepRef.current) sweepRef.current.rotation.z = wrapped
    pointMat.uniforms.uSweep.value = wrapped
    pointMat.uniforms.uPR.value = gl.getPixelRatio()
    pointMat.uniforms.uOpacity.value = appear
    ringMat.opacity = 0.22 * appear
    sweepMat.uniforms.uO.value = s.reduced ? 0.6 : appear
    const lo = band(s.beta, 0.2, 0.35) * (1 - band(s.beta, 0.88, 1))
    labels.current.forEach((el) => el && (el.style.opacity = String(s.reduced ? 1 : lo)))
    // Callout: the leader draws out from the coin first, then the card resolves at the end of it.
    const cp = s.reduced ? 1 : band(s.beta, 0.32, 0.62) * (1 - band(s.beta, 0.86, 0.96))
    if (anchor) {
      const lt = smooth(band(cp, 0, 0.3))
      const arr = leader.attributes.position.array as Float32Array
      arr.set([anchor.x, anchor.y, 0, anchor.x + (dock[0] - anchor.x) * lt, anchor.y + (dock[1] - anchor.y) * lt, 0])
      leader.attributes.position.needsUpdate = true
      leaderMat.opacity = lt > 0 ? 0.45 : 0
    }
    if (callout.current) applyResolve(callout.current, band(cp, 0.3, 1))
  })

  return (
    <group ref={group}>
      <lineSegments geometry={rings} material={ringMat} />
      <mesh ref={sweepRef} material={sweepMat}>
        <circleGeometry args={[R_OUT, 64, 0, 1.1]} />
      </mesh>
      <points geometry={pointGeo} material={pointMat} frustumCulled={false} />
      {top.map((k, i) => (
        <Html key={k.symbol} portal={portal} position={[k.x, k.y, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          <div ref={(el) => void (labels.current[i] = el)} className="a-coin-label" data-alert={k.status === "ok" ? "" : undefined}>
            {k.symbol} <span>{k.net.toFixed(1)}%</span>
          </div>
        </Html>
      ))}
      {anchor && reading && (
        <lineSegments geometry={leader} material={leaderMat} />
      )}
      {anchor && reading && (
        <Html portal={portal} position={[dock[0], dock[1], 0]} zIndexRange={[6, 0]} style={{ pointerEvents: "none" }}>
          <div ref={callout} className="a-callout" data-dock={mobile ? "below" : "right"} style={{ visibility: "hidden" }}>
            <div className="a-glass a-callout-card">
              <p className="a-mono" style={{ margin: 0, color: "var(--a-faint)", fontSize: 9.5 }}>
                Loudest {reading.ok ? "clean scent" : "reading · building history"}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                <span className="a-display" style={{ fontSize: "1.6rem" }}>
                  {reading.symbol}
                </span>
                <span className="a-mono" style={{ fontSize: 14, letterSpacing: "0.06em", color: reading.ok ? "var(--a-orange)" : "var(--a-star)" }}>
                  {reading.net.toFixed(1)}% net
                </span>
              </div>
              <div style={{ marginTop: 8 }}>
                <SourceTag kind={reading.live ? "live" : "sample"} ts={reading.ts} stale={reading.stale} />
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ---------------------------------------------------------------- camera + post

function Rig() {
  const { camera } = useThree()
  useFrame((_, dt) => {
    const s = useSky.getState()
    camera.position.x = THREE.MathUtils.damp(camera.position.x, s.pointer[0] * 0.45, 2.5, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, s.pointer[1] * 0.28, 2.5, dt)
    camera.lookAt(0, 0, -4)
  })
  return null
}

function Post() {
  const crawl = useMemo(() => new CrawlEffect(), [])
  const { size, gl } = useThree()
  useFrame(() => {
    const s = useSky.getState()
    const u = crawl.uniforms
    u.get("uProgress")!.value = s.reduced ? 0 : s.crawl
    u.get("uMode")!.value = s.grain === "pixel" ? 0 : s.grain === "dither" ? 1 : 2
    ;(u.get("uRes")!.value as THREE.Vector2).set(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio())
  })
  return (
    <EffectComposer multisampling={0} enabled={!(typeof window !== "undefined" && window.location.search.includes("nopost"))}>
      <primitive object={crawl} dispose={null} />
      <Noise opacity={0.03} premultiply />
      <Vignette offset={0.22} darkness={0.85} />
    </EffectComposer>
  )
}

export default function AlmagestSky({ coins, labels, reading }: { coins: RadarCoin[]; labels: HTMLElement; reading: Reading | null }) {
  const mobile = useSky((s) => s.mobile)
  const portal = useMemo(() => ({ current: labels }), [labels])
  return (
    <Canvas
      className="a-canvas"
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 400 }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      onCreated={({ gl }) => gl.setClearColor(SKY.void)}
    >
      <DeepSky />
      <GlassHound />
      <CanisMajor portal={portal} />
      <Radar coins={coins} portal={portal} reading={reading} />
      <Rig />
      <Post />
    </Canvas>
  )
}
