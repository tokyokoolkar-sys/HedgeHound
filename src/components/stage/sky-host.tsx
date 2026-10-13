// Mounted once in __root.tsx. Keeps SkyStage dormant (no WebGL, no 3D code loaded) until a page calls
// useRequestSky(); from then on it stays alive across navigation (T12 decision a). If WebGL fails, the
// page simply stays on the void background and the copy keeps working.
import { lazy, Suspense } from "react"
import { useStage } from "@/lib/stage/store"
import { WebglBoundary } from "../webgl-boundary"

const SkyStage = lazy(() => import("./sky-stage"))

export function SkyHost() {
  const sky = useStage((s) => s.sky)
  if (!sky) return null
  return (
    <WebglBoundary>
      <Suspense fallback={null}>
        <SkyStage />
      </Suspense>
    </WebglBoundary>
  )
}
