// Direction spike D1 "Almagest" (throwaway). Shared state between the DOM scroll and the 3D sky.
// 3D reads it with getState() inside useFrame, so scrolling never re-renders React.
import { create } from "zustand"

/** Spike-only colours. Final values move to lib/palette.ts + styles.css when the direction is chosen. */
export const SKY = {
  void: "#010104",
  starlight: "#f4f1ea",
  line: "#9aa0ad",
  cyan: "#7fdcff",
  orange: "#ff8a3d",
  coolStar: "#c9d6ff",
  warmStar: "#ffe2c4",
} as const

export type TypePair = "inscription" | "codex" | "observatory"
export type GrainMode = "pixel" | "dither" | "mixed"

export const TYPE_PAIRS: Record<TypePair, { label: string; display: string }> = {
  inscription: { label: "Marcellus + Mono", display: "Marcellus" },
  codex: { label: "EB Garamond + Mono", display: "EB Garamond" },
  observatory: { label: "Noto Serif Display + Mono", display: "Noto Serif Display" },
}

type Sky = {
  /** 0..1 progress through each scroll section. */
  hero: number
  alpha: number
  crawl: number
  beta: number
  /** Smoothed pointer, -1..1. */
  pointer: [number, number]
  grain: GrainMode
  reduced: boolean
  mobile: boolean
  set: (p: Partial<Omit<Sky, "set">>) => void
}

export const useSky = create<Sky>((set) => ({
  hero: 0,
  alpha: 0,
  crawl: 0,
  beta: 0,
  pointer: [0, 0],
  grain: "mixed",
  reduced: false,
  mobile: false,
  set: (p) => set(p),
}))

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** Remap v from [a,b] to [0,1], clamped. */
export const band = (v: number, a: number, b: number) => clamp01((v - a) / (b - a))
export const smooth = (t: number) => t * t * (3 - 2 * t)
