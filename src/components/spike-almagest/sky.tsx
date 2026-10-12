// Direction spike D1 "Almagest": the whole 3D sky for the prototype route (throwaway).
// One canvas: far star shell, parallax flight layers, the glass hound, Canis Major, the radar,
// and a post stack (bloom, the pixel-grain crawl, film grain, vignette).
import { Html } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { SVGLoader } from "three-stdlib"
import { CMA, CMA_LINES, magToPx, project } from "./canis-major"
import { CrawlEffect } from "./transition-effect"
import { SKY, band, smooth, useSky } from "./state"

type Portal = React.MutableRefObject<HTMLElement>

export type RadarCoin = { symbol: string; net: number; status: "ok" | "building history" }

// ---------------------------------------------------------------- star shader

const starVert = /* glsl */ `
uniform float uTime, uPR, uForm, uPersp, uFlight, uWrap, uZMin, uZRange;
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
  gl_PointSize = max(1.0, aSize * uPR * att);
  // Fade wrapped layers in from depth and out before they reach the lens.
  float depthFade = uWrap > 0.5 ? smoothstep(uZMin, uZMin + 8.0, p.z) * (1.0 - smoothstep(6.0, 9.5, p.z)) : 1.0;
  vColor = aColor;
  vA = tw * smoothstep(0.0, 0.35, t) * depthFade;
}`

const starFrag = /* glsl */ `
uniform float uOpacity, uSoft;
varying vec3 vColor; varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c);
  float core = exp(-d2 * mix(140.0, 9.0, uSoft));
  float halo = exp(-d2 * mix(18.0, 5.0, uSoft)) * mix(0.30, 0.55, uSoft);
  float a = (core + halo) * vA * uOpacity * smoothstep(0.5, 0.36, sqrt(d2));
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * a, 1.0);
}`

function starMaterial(o: { persp?: boolean; soft?: number; wrap?: [number, number] } = {}) {
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
    const g = new THREE.ExtrudeGeometry(shapes, {
      depth: 7,
      bevelEnabled: true,
      bevelThickness: 2.2,
      bevelSize: 1.4,
      bevelSegments: 10,
      curveSegments: 40,
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

// Crystal glass on black: dark body, fresnel rim with a chromatic split, stars seen "through" the
// glass bent by the surface normal, and one moving specular streak. No environment map needed.
const glassFrag = /* glsl */ `
uniform float uTime, uO;
uniform vec3 uRimA, uRimB, uStar;
varying vec3 vN; varying vec3 vV; varying vec4 vClip; varying vec3 vObj;
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
float stars(vec2 uv) {
  vec2 g = uv * 70.0; vec2 i = floor(g); vec2 f = fract(g) - 0.5;
  float h = hash(i);
  vec2 o = vec2(hash(i + 3.1), hash(i + 7.7)) - 0.5;
  float d = length(f - o * 0.7);
  return step(0.93, h) * exp(-d * d * 260.0) * (0.4 + h);
}
void main() {
  vec3 n = normalize(vN); vec3 v = normalize(vV);
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fr = pow(1.0 - ndv, 2.6);
  vec2 suv = vClip.xy / vClip.w * 0.5 + 0.5;
  vec2 bend = n.xy * 0.045;
  float sR = stars(suv + bend * 1.08);
  float sG = stars(suv + bend);
  float sB = stars(suv + bend * 0.92);
  vec3 seen = vec3(sR, sG, sB) * uStar * 1.6;
  vec3 body = mix(vec3(0.01, 0.012, 0.03), vec3(0.035, 0.05, 0.1), smoothstep(-1.0, 1.0, vObj.y));
  vec3 rim = mix(uRimA, uRimB, smoothstep(0.2, 1.0, fr)) * fr * 2.1;
  vec3 l = normalize(vec3(sin(uTime * 0.35) * 0.8, 0.7, 0.6));
  float spec = pow(max(dot(reflect(-l, n), v), 0.0), 80.0) * 1.4;
  float caustic = smoothstep(0.6, 1.0, sin(vObj.x * 6.0 + vObj.y * 4.0 + uTime * 0.6)) * 0.05 * (1.0 - fr);
  vec3 col = body + seen * (0.35 + 0.65 * (1.0 - fr)) + rim + vec3(spec) + caustic * uStar;
  float a = clamp(0.32 + fr * 0.68 + spec, 0.0, 1.0) * uO;
  gl_FragColor = vec4(col, a);
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
        uniforms: {
          uTime: { value: 0 },
          uO: { value: 1 },
          uRimA: { value: C.cool.clone() },
          uRimB: { value: C.cyan.clone().lerp(C.star, 0.35) },
          uStar: { value: C.star.clone() },
        },
      }),
    [],
  )
  useFrame(({ clock }, dt) => {
    glass.uniforms.uTime.value = clock.elapsedTime
    const s = useSky.getState()
    const g = ref.current
    if (!g) return
    const away = smooth(band(s.hero, 0.25, 1))
    g.visible = s.alpha < 0.45
    const t = clock.elapsedTime
    const idle = s.reduced ? 0 : 1
    g.position.set(0, 0.85 + Math.sin(t * 0.6) * 0.08 * idle, -away * 34)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, Math.sin(t * 0.25) * 0.45 * idle + s.pointer[0] * 0.35 + away * 1.2, 3, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -s.pointer[1] * 0.2, 3, dt)
    g.scale.setScalar(0.78 - away * 0.3)
  })
  return (
    <group ref={ref}>
      <mesh geometry={geo}>
        <primitive object={glass} attach="material" />
      </mesh>
    </group>
  )
}

/** A faint cold haze behind the hound, so the glass has something to bend. */
function Haze() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uO: { value: 1 }, uC: { value: C.cool.clone() } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uO; uniform vec3 uC; varying vec2 vUv;
          void main(){ float d = length(vUv - 0.5) * 2.0; float a = exp(-d*d*3.6) * 0.035 * uO; gl_FragColor = vec4(uC * a, 1.0); }`,
      }),
    [],
  )
  useFrame(() => {
    const s = useSky.getState()
    mat.uniforms.uO.value = 1 - band(s.hero, 0.2, 0.9)
  })
  return (
    <mesh position={[0, 0.2, -6]} material={mat}>
      <planeGeometry args={[22, 22]} />
    </mesh>
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
  const mat = useMemo(() => starMaterial({ persp: true }), [])

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
  gl_FragColor = vec4(vColor * a, 1.0);
}`

function hashAngle(sym: string) {
  let h = 2166136261
  for (let i = 0; i < sym.length; i++) h = Math.imul(h ^ sym.charCodeAt(i), 16777619)
  return ((h >>> 0) / 4294967296) * Math.PI * 2
}

const R_OUT = 3.6

function Radar({ coins, portal }: { coins: RadarCoin[]; portal: Portal }) {
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
  const top = useMemo(() => [...placed].sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 6), [placed])

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
            gl_FragColor = vec4(uC * a, 1.0);
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
    g.position.set(s.mobile ? 0 : 2.2, s.mobile ? 1.4 : -0.1, -2 + appear * 2 - band(s.beta, 0.85, 1) * 6)
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
  useFrame(({ clock }) => {
    const s = useSky.getState()
    const u = crawl.uniforms
    u.get("uProgress")!.value = s.reduced ? 0 : s.crawl
    u.get("uTime")!.value = clock.elapsedTime
    u.get("uMode")!.value = s.grain === "pixel" ? 0 : s.grain === "dither" ? 1 : 2
    ;(u.get("uRes")!.value as THREE.Vector2).set(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio())
  })
  return (
    <EffectComposer multisampling={0} enabled={!(typeof window !== "undefined" && window.location.search.includes("nopost"))}>
      <Bloom mipmapBlur luminanceThreshold={0.72} luminanceSmoothing={0.15} intensity={0.9} radius={0.65} />
      <primitive object={crawl} dispose={null} />
      <Noise opacity={0.05} premultiply />
      <Vignette offset={0.22} darkness={0.85} />
    </EffectComposer>
  )
}

export default function AlmagestSky({ coins, labels }: { coins: RadarCoin[]; labels: HTMLElement }) {
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
      <Haze />
      <GlassHound />
      <CanisMajor portal={portal} />
      <Radar coins={coins} portal={portal} />
      <Rig />
      <Post />
    </Canvas>
  )
}
