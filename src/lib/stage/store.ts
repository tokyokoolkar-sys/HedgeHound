// The only bridge between the page and the 3D sky (PLAN §4.1). The scroll engine writes it every frame;
// the 3D reads it with `useStage.getState()` inside useFrame, so scrolling never re-renders React.
import { create } from "zustand"
import type { Quality } from "../motion/quality.ts"

export type Mode = "edition" | "sky" | "den" | "quiet"
export type { Quality }

export type StageState = {
  mode: Mode
  /** Index of the active registered section (see lib/motion/scroll-progress.ts). */
  chapter: number
  /** Id of the active section. */
  active: string | null
  /** 0..1 progress within the active section. */
  progress: number
  /** 0..1 progress of every registered section, by id. */
  sections: Record<string, number>
  /** Smoothed pointer, -1..1 on both axes (y up). */
  pointer: [number, number]
  /** Symbol under focus (sky / hover). */
  focus: string | null
  quality: Quality
  reduced: boolean
  /** True while Lenis is driving the scroll (wheel smoothing on, reduced motion off). */
  smooth: boolean
  set: (p: Partial<Omit<StageState, "set">>) => void
}

export const useStage = create<StageState>((set) => ({
  mode: "edition",
  chapter: 0,
  active: null,
  progress: 0,
  sections: {},
  pointer: [0, 0],
  focus: null,
  quality: "high",
  reduced: false,
  smooth: false,
  set: (p) => set(p),
}))
