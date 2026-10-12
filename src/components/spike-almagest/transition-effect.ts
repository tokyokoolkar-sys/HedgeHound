// Full-screen "pixel-grain crawl" transition (spike D1).
// Progress 0→0.5: a noisy front rises from the bottom to the top; everything it passes breaks into
// pixels and grain and drops out. At 0.5 the whole frame is grain (the scene swaps underneath).
// Progress 0.5→1: a second front rises and the next scene resolves out of the grain behind it.
import { Effect, EffectAttribute } from "postprocessing"
import { Uniform, Vector2 } from "three"

const fragment = /* glsl */ `
uniform float uProgress;
uniform float uTime;
uniform float uMode;   // 0 pixel, 1 dither, 2 mixed
uniform vec2 uRes;

// Hoskins hash12: no diagonal banding on integer cell coordinates.
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float p = uProgress;
  if (p <= 0.0001 || p >= 0.9999) { outputColor = inputColor; return; }

  bool out_ = p < 0.5;
  float ph = out_ ? p * 2.0 : (p - 0.5) * 2.0;

  // Ragged front: low-frequency fbm across x, slowly crawling.
  float ragged = (fbm(vec2(uv.x * 5.0, uTime * 0.25)) - 0.5) * 0.22 + (fbm(vec2(uv.x * 23.0, uTime * 0.9)) - 0.5) * 0.06;
  float front = mix(-0.3, 1.3, ph) + ragged;
  float behind = smoothstep(0.0, 0.28, front - uv.y);      // 1 = the front has passed this row
  float amount = out_ ? behind : 1.0 - behind;               // 1 = fully dissolved
  float edge = exp(-pow((uv.y - front) / 0.07, 2.0));        // the crawling band itself

  // Block size per mode (in px).
  float maxBlock = uMode < 0.5 ? 28.0 : (uMode < 1.5 ? 3.0 : 14.0);
  float k = max(amount, edge * 0.9);
  float block = max(1.0, floor(mix(1.0, maxBlock, k * k)));
  vec2 px = uv * uRes;
  vec2 cell = floor(px / block);
  vec2 sampleUv = (cell * block + block * 0.5) / uRes;
  vec4 col = texture2D(inputBuffer, sampleUv);

  // Dropout: per block (pixel mode) or per fine grain cell (dither / mixed), shimmering near the band.
  float grainSize = uMode < 0.5 ? block : 2.0;
  vec2 gcell = floor(px / grainSize);
  float flicker = floor(uTime * 18.0) * edge;
  float n = hash(gcell + flicker * 13.7);
  float keep = step(amount * 1.02, n);
  col.rgb *= keep;

  // Grain where dissolved: sparse cold sparks, so the void reads as dust, not a black wipe.
  float spark = step(0.992, hash(gcell * 1.37 + floor(uTime * 9.0))) * amount;
  col.rgb += vec3(0.85, 0.92, 1.0) * spark * 0.55;

  // A faint scanning glow on the crawling edge.
  col.rgb += vec3(0.50, 0.86, 1.0) * edge * 0.03 * (0.6 + 0.4 * hash(gcell + floor(uTime * 30.0)));

  outputColor = vec4(col.rgb, inputColor.a);
}
`

export class CrawlEffect extends Effect {
  constructor() {
    super("CrawlEffect", fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ["uProgress", new Uniform(0)],
        ["uTime", new Uniform(0)],
        ["uMode", new Uniform(2)],
        ["uRes", new Uniform(new Vector2(1, 1))],
      ]),
    })
  }
}
