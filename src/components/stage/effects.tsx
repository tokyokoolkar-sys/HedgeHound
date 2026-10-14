// Post stack (DESIGN.md): the scroll-locked bite crawl and light film grain. No bloom (banned). No vignette:
// darkening the near-black void left a one-level oval contour that no grain could dither (P3 critique).
import { useFrame, useThree } from "@react-three/fiber"
import { EffectComposer, Noise } from "@react-three/postprocessing"
import { useMemo } from "react"
import type * as THREE from "three"
import { useStage } from "@/lib/stage/store"
import { CrawlEffect } from "./crawl-effect"

export function Effects() {
  const crawl = useMemo(() => new CrawlEffect(), [])
  const { size, gl } = useThree()
  useFrame(() => {
    const s = useStage.getState()
    const u = crawl.uniforms
    u.get("uProgress")!.value = s.reduced ? 0 : s.transition
    u.get("uMode")!.value = s.grain === "pixel" ? 0 : 1
    ;(u.get("uRes")!.value as THREE.Vector2).set(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio())
  })
  return (
    <EffectComposer multisampling={0}>
      <primitive object={crawl} dispose={null} />
      <Noise opacity={0.03} premultiply />
    </EffectComposer>
  )
}
