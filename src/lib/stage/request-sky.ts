import { useEffect } from "react"
import { useStage } from "./store.ts"

/**
 * Ask for the sky (T12 decision a). SkyStage stays dormant (no WebGL) until the first page calls this,
 * then stays alive across navigation, so legacy pages with their own canvases never run two at once.
 */
export function useRequestSky(mode: "edition" | "sky" | "den" | "quiet" = "edition") {
  useEffect(() => {
    useStage.getState().set({ sky: true, mode })
  }, [mode])
}
