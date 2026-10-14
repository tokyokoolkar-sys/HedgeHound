import { useEffect } from "react"
import { QUIET_SCENE, useStage } from "./store.ts"

/**
 * Ask for the sky (T12 decision a). SkyStage stays dormant (no WebGL) until the first page calls this,
 * then stays alive across navigation, so legacy pages with their own canvases never run two at once.
 * "quiet" (T31) clears whatever the Edition left in the sky and dims the stars behind a working page;
 * the Edition rewrites its own scene every frame when it comes back.
 */
export function useRequestSky(mode: "edition" | "sky" | "den" | "quiet" = "edition") {
  useEffect(() => {
    if (mode === "quiet") useStage.getState().set({ sky: true, mode, scene: QUIET_SCENE, transition: 0, focus: null })
    else useStage.getState().set({ sky: true, mode })
  }, [mode])
}
