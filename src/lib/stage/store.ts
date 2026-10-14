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
  /** δ comet trail: shown, arrival, stacked focus, the head replaying the day (0..1), the flip tick and the
   *  six-hour bracket with their labels, recede. */
  trailOn: number
  trailAppear: number
  trailFocus: number
  trailDraw: number
  trailMarks: number
  trailAway: number
  /** ε field chart: shown, arrival, stacked focus, stars gathering into place, labels, recede. */
  fieldOn: number
  fieldAppear: number
  fieldFocus: number
  fieldForm: number
  fieldLabels: number
  fieldAway: number
  /** ζ kennel: shown, arrival, stacked focus, stars gathering into the pen, labels, recede. */
  kennelOn: number
  kennelAppear: number
  kennelFocus: number
  kennelForm: number
  kennelLabels: number
  kennelAway: number
  /** η embers: shown, arrival, stacked focus, the fall (0..1, scroll-locked), labels, recede. */
  emberOn: number
  emberAppear: number
  emberFocus: number
  emberFall: number
  emberLabels: number
  emberAway: number
  /** θ atlas: shown, arrival, the camera pulling back (0 close … 1 whole field), recap labels, recede. */
  atlasOn: number
  atlasAppear: number
  atlasPull: number
  atlasLabels: number
  atlasAway: number
  /** ι den orb: shown, arrival, stacked focus, scroll turn (0..1), caption, recede. */
  denOn: number
  denAppear: number
  denFocus: number
  denTurn: number
  denLabels: number
  denAway: number
  /** κ: how much of the background sky is lit (1 = all of it; the ledger dims it), and Sirius alone. */
  skyDim: number
  siriusOn: number
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
  trailOn: 0,
  trailAppear: 0,
  trailFocus: 0,
  trailDraw: 0,
  trailMarks: 0,
  trailAway: 0,
  fieldOn: 0,
  fieldAppear: 0,
  fieldFocus: 0,
  fieldForm: 0,
  fieldLabels: 0,
  fieldAway: 0,
  kennelOn: 0,
  kennelAppear: 0,
  kennelFocus: 0,
  kennelForm: 0,
  kennelLabels: 0,
  kennelAway: 0,
  emberOn: 0,
  emberAppear: 0,
  emberFocus: 0,
  emberFall: 0,
  emberLabels: 0,
  emberAway: 0,
  atlasOn: 0,
  atlasAppear: 0,
  atlasPull: 0,
  atlasLabels: 0,
  atlasAway: 0,
  denOn: 0,
  denAppear: 0,
  denFocus: 0,
  denTurn: 0,
  denLabels: 0,
  denAway: 0,
  skyDim: 1,
  siriusOn: 0,
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
