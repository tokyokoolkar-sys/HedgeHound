// Shared star rendering for the sky: one point shader, deterministic star fields, palette colours.
// Colours: SKY_COLORS are THREE.Colors, which three's colour management already stores as linear, so
// shaders use them as they are; only the falloff `a` gets the 2.2 curve, which keeps faint light from
// lifting into grey haze (D1 bug, PLAN §4.1.7). Applying 2.2 to the colour as well linearised it twice and
// turned scent orange red (P3 critique).
import * as THREE from "three"
import { palette } from "@/lib/palette"

const vert = /* glsl */ `
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
  // Wrapped layers fade in from depth and out before they reach the lens.
  float depthFade = uWrap > 0.5 ? smoothstep(uZMin, uZMin + 8.0, p.z) * (1.0 - smoothstep(6.0, 9.5, p.z)) : 1.0;
  vColor = aColor;
  vA = tw * smoothstep(0.0, 0.35, t) * depthFade;
}`

// Crisp round points: a tight core and a small halo that falls to zero before the sprite edge.
// No bloom anywhere (DESIGN.md).
const frag = /* glsl */ `
uniform float uOpacity, uSoft, uHalo;
varying vec3 vColor; varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c);
  float core = exp(-d2 * mix(140.0, 9.0, uSoft));
  float halo = exp(-d2 * mix(18.0, 5.0, uSoft)) * mix(0.30, 0.55, uSoft) * uHalo;
  float a = (core + halo) * vA * uOpacity * smoothstep(0.5, 0.36, sqrt(d2));
  if (a < 0.004) discard;
  gl_FragColor = vec4(max(vColor, vec3(0.0)) * pow(max(a, 0.0), 2.2), 1.0);
}`

export type StarMaterialOptions = { persp?: boolean; soft?: number; wrap?: [number, number]; halo?: number }

export function starMaterial(o: StarMaterialOptions = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
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
      uHalo: { value: o.halo ?? 1 },
    },
  })
}

export const SKY_COLORS = {
  star: new THREE.Color(palette.starlight),
  cool: new THREE.Color(palette.starCool),
  warm: new THREE.Color(palette.starWarm),
  line: new THREE.Color(palette.chartLine),
  scan: new THREE.Color(palette.scan),
  scent: new THREE.Color(palette.scent),
}

/** Deterministic PRNG (LCG): the sky looks the same on every load. */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** A star's colour temperature: mostly starlight, leaning cool or warm. */
export function starColor(r: number) {
  const { star, cool, warm } = SKY_COLORS
  return r < 0.55 ? star.clone().lerp(cool, (r / 0.55) * 0.8) : star.clone().lerp(warm, ((r - 0.55) / 0.45) * 0.7)
}

export type Field = {
  position: Float32Array
  aStart: Float32Array
  aSize: Float32Array
  aColor: Float32Array
  aPhase: Float32Array
  aDelay: Float32Array
}

export function emptyField(n: number): Field {
  return {
    position: new Float32Array(n * 3),
    aStart: new Float32Array(n * 3),
    aSize: new Float32Array(n),
    aColor: new Float32Array(n * 3),
    aPhase: new Float32Array(n),
    aDelay: new Float32Array(n),
  }
}

export function makeField(
  n: number,
  seed: number,
  place: (r: () => number, i: number) => { p: [number, number, number]; size: number },
): Field {
  const r = rng(seed)
  const f = emptyField(n)
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
