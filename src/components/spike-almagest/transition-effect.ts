// Full-screen "grain crawl" transition (spike D1), locked to the scroll.
// Nothing here reads the clock: the front, its ragged edge and every flicker are functions of the
// scroll progress, so the crawl moves only while you scroll and freezes the moment you stop.
// Progress 0→0.5: a ragged front rises; what it passes breaks into fine grain and goes dark,
// leaving sparse stars that shimmer as you scroll. 0.5→1: a second front rebuilds the next scene.
import { Effect, EffectAttribute } from "postprocessing"
import { Uniform, Vector2 } from "three"

const fragment = /* glsl */ `
uniform float uProgress;
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
  // "Scroll time": the only animation clock. Drifts the edge noise as the front climbs.
  float s = p * 6.0;

  // Static ragged edge: the front only ever advances, so a bite never grows back mid-scroll.
  float ragged = (fbm(vec2(uv.x * 4.0, 7.0)) - 0.5) * 0.18 + (fbm(vec2(uv.x * 17.0, 3.0)) - 0.5) * 0.05;
  float front = mix(-0.45, 1.45, ph) + ragged;
  // How strongly this row is being eaten: bites start well ahead of the front and thicken behind it.
  float hunger = smoothstep(-0.12, 0.4, front - uv.y);
  float amount = out_ ? hunger : 1.0 - hunger;

  vec2 px = uv * uRes;
  // Bites, not a slide: every cell has its own fixed moment. Once the hunger passes it, the cell is
  // gone and stays gone, so each bit of scroll takes new bites out of the picture.
  float bigSize = uMode < 0.5 ? 26.0 : (uMode < 1.5 ? 14.0 : 18.0);
  float smallSize = uMode < 0.5 ? 26.0 : 4.0;
  float bigBite = step(hash(floor(px / bigSize) + 17.0), amount * 0.85);
  float smallBite = step(hash(floor(px / smallSize) + 3.0), amount);
  float eaten = max(bigBite, smallBite);

  vec4 col = inputColor;
  // Pixel mode: what survives near the front also turns blocky.
  if (uMode < 0.5 && amount > 0.02) {
    vec2 cell = floor(px / 10.0);
    col = texture2D(inputBuffer, (cell * 10.0 + 5.0) / uRes);
  }
  col.rgb *= 1.0 - eaten;

  // Where it is dissolved: sparse cold stars that twinkle with the scroll, not a cloud.
  // Two sizes of star; each one shimmers on its own phase as you scroll.
  vec2 sc = floor(px / 2.0);
  float star = step(0.993, hash(sc * 1.37 + 11.0));
  float bright = step(0.9985, hash(floor(px / 3.0) * 2.11 + 5.0));
  float ph_ = hash(sc + 4.0) * 6.2831;
  float tw = pow(0.5 + 0.5 * sin(ph_ + s * (6.0 + hash(sc) * 10.0)), 2.0);
  col.rgb += vec3(0.70, 0.78, 1.0) * (star * 0.55 + bright * 1.1) * (0.25 + 0.75 * tw) * eaten;


  outputColor = vec4(col.rgb, inputColor.a);
}
`

export class CrawlEffect extends Effect {
  constructor() {
    super("CrawlEffect", fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ["uProgress", new Uniform(0)],
        ["uMode", new Uniform(1)],
        ["uRes", new Uniform(new Vector2(1, 1))],
      ]),
    })
  }
}
