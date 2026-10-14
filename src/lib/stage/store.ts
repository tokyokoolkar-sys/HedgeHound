// The only bridge between the page and the 3D sky (PLAN §4.1). The scroll engine writes it every frame;
// the 3D reads it with `useStage.getState()` inside useFrame, so scrolling never re-renders React.
import { create } from "zustand"
import type { Quality } from "../motion/quality.ts"

export type Mode = "edition" | "sky" | "den" | "quiet"
export type { Quality }
export type Grain = "dither" | "pixel"

/**
 * Scene channels: 0..1 values the chapters write from their scroll progress and the 3D objects read.
 * They are the whole contract between copy and sky; objects never read the clock for choreography.
 */
export type Scene = {
  /** Glass hound recede (0 = resting, 1 = gone). */
  houndAway: number
  /** Canis Major: shown at all (0/1), star formation, line draw-in, label fade, recede into depth. */
  canisOn: number
  canisForm: number
  canisLines: number
  canisLabels: number
  canisAway: number
  /** β radar: shown at all (0/1), arrival (scale + fade), coin labels, the reading (leader then specks), recede. */
  radarOn: number
  radarAppear: number
  /** Stacked layouts: 0 = tucked under the copy (rings only), 1 = featured on its own with the reading. */
  radarFocus: number
  radarLabels: number
  reading: number
  radarAway: number
  /** γ astrolabe: shown, arrival, stacked focus, scroll turn (0..1 = the chapter), legs split apart,
   *  leg labels, the price swing, recede. */
  astroOn: number
  astroAppear: number
  astroFocus: number
  astroTurn: number
  spreadSplit: number
  legLabels: number
  spreadSwing: number
  astroAway: number
  /** Distance flown through the dust layers (grows with scroll; drives parallax). */
  flight: number
}

export const EMPTY_SCENE: Scene = {
  houndAway: 0,
  canisOn: 0,
  canisForm: 0,
  canisLines: 0,
  canisLabels: 0,
  canisAway: 0,
  radarOn: 0,
  radarAppear: 0,
  radarFocus: 0,
  radarLabels: 0,
  reading: 0,
  radarAway: 0,
  astroOn: 0,
  astroAppear: 0,
  astroFocus: 0,
  astroTurn: 0,
  spreadSplit: 0,
  legLabels: 0,
  spreadSwing: 0,
  astroAway: 0,
  flight: 0,
}

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
  /** A page has asked for the sky (T12 decision a): SkyStage starts then and stays alive after. */
  sky: boolean
  /** Bite-crawl progress, 0..1 (0.5 = fully eaten, the scene swaps underneath). */
  transition: number
  grain: Grain
  scene: Scene
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
  sky: false,
  transition: 0,
  grain: "dither",
  scene: EMPTY_SCENE,
  set: (p) => set(p),
}))
