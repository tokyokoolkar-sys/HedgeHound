// The glass material shared by the glass hound and the den's orb (DESIGN.md "Signature: the glass hound").
// Clear crystal on black: a nearly invisible body, a soft fresnel rim, stars bent through the glass with
// only a hint of dispersion, one highlight that follows the cursor (uLight). Linear output (pow 2.2).
import * as THREE from "three"
import { SKY_COLORS } from "./star-points"

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
uniform float uO, uSpec, uEdge, uBroad;
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
  vec3 rim = uRim * (fr * 1.5 * uBroad + pow(fr, 4.0) * 1.6) + uRim * smoothstep(0.35, 0.9, fr) * 0.25 * uBroad;
  vec3 l = normalize(vec3(uLight * 0.9, 0.75));
  float spec = pow(max(dot(reflect(-l, n), v), 0.0), 120.0) * 1.6 * uSpec;
  float sheen = pow(max(dot(reflect(-l, n), v), 0.0), 8.0) * 0.08;
  vec3 col = seen * (0.4 + 0.6 * (1.0 - fr)) + rim + vec3(spec + sheen);
  // uBroad = 1 is exactly the hound's alpha; lower trades the broad body for a crisp edge (the orb).
  float a = clamp(0.1 * uBroad + (fr * 0.85 * uBroad + pow(fr, 4.0) * (1.0 - uBroad)) * uEdge + spec + length(seen) * 0.4, 0.0, 1.0) * uO;
  gl_FragColor = vec4(pow(max(col, vec3(0.0)), vec3(2.2)), a);
}`

export type GlassOptions = {
  /** Rim brightness (1 = the hound). A full sphere is all silhouette, so the orb wants less. */
  rim?: number
  /** Highlight strength (1 = the hound). */
  spec?: number
  /** Stars seen through the glass (1 = the hound). 0 when the glass holds real data behind it. */
  stars?: number
  /** The broad fresnel body (1 = the hound). Low keeps only the crisp edge, no grey fill. */
  broad?: number
}

export function glassMaterial({ rim = 1, spec = 1, stars = 1, broad = 1 }: GlassOptions = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uO: { value: 1 },
      uLight: { value: new THREE.Vector2(0.3, 0.5) },
      uRim: { value: SKY_COLORS.star.clone().lerp(SKY_COLORS.cool, 0.25).multiplyScalar(rim) },
      uStar: { value: SKY_COLORS.star.clone().multiplyScalar(stars) },
      uSpec: { value: spec },
      uEdge: { value: rim },
      uBroad: { value: broad },
    },
  })
}
