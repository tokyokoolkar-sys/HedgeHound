// Post stack (DESIGN.md): the scroll-locked bite crawl and light film grain. No bloom (banned). No vignette:
// darkening the near-black void left a one-level oval contour that no grain could dither (P3 critique).
import { useFrame, useThree } from "@react-three/fiber"
import { EffectComposer, Noise } from "@react-three/postprocessing"
import type { EffectComposer as Composer, Pass } from "postprocessing"
import { useEffect, useMemo, useRef } from "react"
import type * as THREE from "three"
import { useStage } from "@/lib/stage/store"
import { CrawlEffect } from "./crawl-effect"

/**
 * `onReady` fires once every pass's shader is compiled, so the first frame drawn through the composer
 * carries no compile (sky-stage holds the Driver until then).
 */
export function Effects({ onReady }: { onReady?: () => void }) {
  const crawl = useMemo(() => new CrawlEffect(), [])
  const { size, gl } = useThree()
  const composer = useRef<Composer>(null)

  useEffect(() => {
    if (!onReady) return
    let cancelled = false
    let raf = 0
    // The composer and its passes arrive over a few commits (async init, then layout effects): wait for them.
    const wait = () => {
      const passes = (composer.current?.passes ?? []) as Array<Pass & { scene: THREE.Scene; camera: THREE.Camera }>
      if (!passes.some((p) => p.fullscreenMaterial)) {
        raf = requestAnimationFrame(wait)
        return
      }
      void (async () => {
        for (const p of passes) {
          if (cancelled) return
          if (!p.fullscreenMaterial) continue
          try {
            await gl.compileAsync(p.scene, p.camera)
          } catch {
            // Falls back to compiling on the first frame, as before.
          }
          await new Promise((r) => requestAnimationFrame(r))
        }
        if (!cancelled) onReady()
      })()
    }
    wait()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [gl, onReady])

  useFrame(() => {
    const s = useStage.getState()
    const u = crawl.uniforms
    u.get("uProgress")!.value = s.reduced ? 0 : s.transition
    u.get("uMode")!.value = s.grain === "pixel" ? 0 : 1
    ;(u.get("uRes")!.value as THREE.Vector2).set(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio())
    // The nav band (64 px) and the bottom coordinate line (about 56 px) stay clear of crawl stars.
    ;(u.get("uChrome")!.value as THREE.Vector2).set(72 / size.height, 56 / size.height)
  })
  return (
    <EffectComposer ref={composer} multisampling={0}>
      <primitive object={crawl} dispose={null} />
      <Noise opacity={0.03} premultiply />
    </EffectComposer>
  )
}
