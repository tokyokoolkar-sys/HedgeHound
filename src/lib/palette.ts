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

  // v1 palette, used by the legacy pages and scenes until they are rebuilt (T10 decision 1b). Remove in T51.
  bg: "#090705",
  surface: "#16110c",
  fg: "#f6f0e6",
  v1Muted: "#b3a498",
  faint: "#7a6d60",
  line: "#3a2e24",
  brand: "#ff6a1a",
  ember: "#ffb15a",
  scorch: "#c2410c",
  clay: "#e07a64",
  cream: "#f3ead7",
  cream2: "#e6d9c4",
  ink: "#1c140e",
  inkSoft: "#5c4a3a",
} as const

export type PaletteKey = keyof typeof palette
