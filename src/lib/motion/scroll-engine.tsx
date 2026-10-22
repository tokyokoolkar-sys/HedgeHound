"use client"
// The scroll engine (T11). Mounted once in __root.tsx, client-only.
// - Lenis smooths mouse-wheel scrolling (lerp 0.075, as in the D1 prototype); touch keeps native scroll.
// - One gsap.ticker loop: advance Lenis, write section progress + smoothed pointer to the stage store,
//   then run `afterScroll` callbacks (SkyStage renders there in T12).
// - Nothing here animates on a clock: progress is a pure function of the scroll position.
// - Reduced motion: no Lenis (native scroll); progress is still written so pages can switch scenes.
import { useEffect } from "react"
import { useStage } from "../stage/store.ts"
import { damp } from "./math.ts"
import { detectTier } from "./quality.ts"
import { measureSections, readSections } from "./scroll-progress.ts"
import { afterScroll, setLenis } from "./scroll-bus.ts"

export function ScrollEngine() {
  useEffect(() => {
    let disposed = false
    let cleanup = () => {}

    void (async () => {
      const [{ gsap }, { default: Lenis }] = await Promise.all([import("gsap"), import("lenis")])
      if (disposed) return

      const store = useStage.getState()
      const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)")
      store.set({ quality: detectTier() })

      // --- Lenis: wheel only (touch stays native, owner decision), off under reduced motion.
      let lenis: InstanceType<typeof Lenis> | null = null
      const startLenis = () => {
        if (lenis) return
        lenis = new Lenis({ autoRaf: false, lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.9, syncTouch: false })
        setLenis(lenis)
        gsap.ticker.lagSmoothing(0)
        useStage.getState().set({ smooth: true })
      }
      const stopLenis = () => {
        if (!lenis) return
        // S5: reset() first, or Lenis re-adds a stale `html.lenis` class after destroy.
        ;(lenis as unknown as { reset(): void }).reset()
        lenis.destroy()
        lenis = null
        setLenis(null)
        gsap.ticker.lagSmoothing(500, 33)
        useStage.getState().set({ smooth: false })
      }
      const applyReduced = () => {
        useStage.getState().set({ reduced: reducedMq.matches })
        if (reducedMq.matches) stopLenis()
        else startLenis()
      }
      applyReduced()
      reducedMq.addEventListener("change", applyReduced)

      // --- Section measurement: late fonts / content change heights (S5), so watch the body.
      let measureTimer = 0
      const remeasure = () => {
        window.clearTimeout(measureTimer)
        measureTimer = window.setTimeout(() => {
          measureSections()
          lenis?.resize()
        }, 120)
      }
      const ro = new ResizeObserver(remeasure)
      ro.observe(document.body)
      window.addEventListener("resize", remeasure)

      // --- Pointer, smoothed in the tick.
      const target: [number, number] = [0, 0]
      const onPointer = (e: PointerEvent) => {
        target[0] = (e.clientX / window.innerWidth) * 2 - 1
        target[1] = -((e.clientY / window.innerHeight) * 2 - 1)
      }
      window.addEventListener("pointermove", onPointer, { passive: true })

      let last = performance.now()
      const tick = (timeSeconds: number) => {
        const now = timeSeconds * 1000
        lenis?.raf(now)
        const dt = Math.min(0.1, (now - last) / 1000)
        last = now
        const s = useStage.getState()
        const y = lenis ? lenis.scroll : window.scrollY
        const read = readSections(y)
        s.set({ ...read, pointer: [damp(s.pointer[0], target[0], 3.5, dt), damp(s.pointer[1], target[1], 3.5, dt)] })
        afterScroll.forEach((cb) => cb(now))
      }
      gsap.ticker.add(tick)

      cleanup = () => {
        gsap.ticker.remove(tick)
        reducedMq.removeEventListener("change", applyReduced)
        window.removeEventListener("resize", remeasure)
        window.removeEventListener("pointermove", onPointer)
        window.clearTimeout(measureTimer)
        ro.disconnect()
        stopLenis()
      }
    })()

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return null
}
