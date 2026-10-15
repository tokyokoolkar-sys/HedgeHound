/**
 * Colour tokens for code that can't read CSS variables (three.js, canvas, SVG math).
 * Mirrors the `@theme` block in src/styles.css (DESIGN.md is normative). `palette.test.ts` fails if they drift.
 *
 * Meaning, not decoration: `scan` = scanning / long leg / focus, `scent` = alerts / short leg.
 */
export const palette = {
  void: "#010104",
  starlight: "#f4f1ea",
  chartLine: "#9aa0ad",
  scan: "#7fdcff",
  scent: "#ff8a3d",
  starCool: "#c9d6ff",
  starWarm: "#ffe2c4",
  /** `--color-starlight-dim` / `-faint`: starlight at these alphas. */
  starlightDimAlpha: 0.62,
  starlightFaintAlpha: 0.38,

} as const

export type PaletteKey = keyof typeof palette
