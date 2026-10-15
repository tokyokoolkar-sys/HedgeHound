// The bite crawl (DESIGN.md signature component), locked to the scroll.
// No clock: the front, the bites and the star shimmer are functions of `uProgress` only.
// 0 → 0.5: a ragged front rises; every 4px crumb (plus 14px chunks) has a fixed moment to be bitten and
// stays gone, leaving sparse stars that shimmer as you scroll. 0.5 → 1: the next scene rebuilds the same way.
import { Effect, EffectAttribute } from "postprocessing"
import { Uniform, Vector2 } from "three"

const fragment = /* glsl */ `
uniform float uProgress;
uniform float uMode;   // 0 pixel, 1 dither (default)
uniform vec2 uRes;
uniform vec2 uChrome;  // CSS-px bands kept free of crawl stars: the nav (top) and the coordinate line (bottom), as uv fractions

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
  float s = p * 6.0; // scroll-time: the only animation clock

  // Static ragged edge: the front only ever advances, so a bite never grows back mid-scroll.
  float ragged = (fbm(vec2(uv.x * 4.0, 7.0)) - 0.5) * 0.18 + (fbm(vec2(uv.x * 17.0, 3.0)) - 0.5) * 0.05;
  float front = mix(-0.45, 1.45, ph) + ragged;
  float hunger = smoothstep(-0.12, 0.4, front - uv.y);
  float amount = out_ ? hunger : 1.0 - hunger;

  vec2 px = uv * uRes;
  float bigSize = uMode < 0.5 ? 26.0 : 14.0;
  float smallSize = uMode < 0.5 ? 26.0 : 4.0;
  float bigBite = step(hash(floor(px / bigSize) + 17.0), amount * 0.85);
  float smallBite = step(hash(floor(px / smallSize) + 3.0), amount);
  float eaten = max(bigBite, smallBite);

  vec4 col = inputColor;
  if (uMode < 0.5 && amount > 0.02) {
    vec2 cell = floor(px / 10.0);
    col = texture2D(inputBuffer, (cell * 10.0 + 5.0) / uRes);
  }
  col.rgb *= 1.0 - eaten;

  // Where it is eaten: sparse stars in two sizes, each shimmering on its own phase as you scroll.
  vec2 sc = floor(px / 2.0);
  float star = step(0.993, hash(sc * 1.37 + 11.0));
  float bright = step(0.9985, hash(floor(px / 3.0) * 2.11 + 5.0));
  float tw = pow(0.5 + 0.5 * sin(hash(sc + 4.0) * 6.2831 + s * (6.0 + hash(sc) * 10.0)), 2.0);
  // No stars behind the nav or the coordinate line: there they read as dirt on the words (P4 critique).
  float chrome = smoothstep(1.0 - uChrome.x - 0.02, 1.0 - uChrome.x, uv.y) + (1.0 - smoothstep(uChrome.y, uChrome.y + 0.02, uv.y));
  col.rgb += vec3(0.70, 0.78, 1.0) * (star * 0.55 + bright * 1.1) * (0.25 + 0.75 * tw) * eaten * (1.0 - min(1.0, chrome));

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
        ["uChrome", new Uniform(new Vector2(0, 0))],
      ]),
    })
  }
}
