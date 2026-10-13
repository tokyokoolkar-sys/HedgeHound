import { useEffect, useRef } from "react"
import { afterScroll } from "@/lib/motion/scroll-bus"
import { useStage, type StageState } from "@/lib/stage/store"

/**
 * Run `frame` on every scroll-engine tick with the current stage state. The callback is kept in a ref,
 * so it always sees fresh props without re-subscribing. Use it to write styles to refs, never state.
 */
export function useScrollFrame(frame: (s: StageState) => void) {
  const cb = useRef(frame)
  cb.current = frame
  useEffect(() => {
    const run = () => cb.current(useStage.getState())
    afterScroll.add(run)
    return () => void afterScroll.delete(run)
  }, [])
}
