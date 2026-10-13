// Positions every registered ProjectedLabel onto its 3D point, once per frame, inside the one canvas.
import { useFrame, useThree } from "@react-three/fiber"
import { useMemo } from "react"
import * as THREE from "three"
import { projected } from "@/lib/stage/projector"

export function Projector() {
  const { camera, size } = useThree()
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    projected.forEach(({ el, point, offset }) => {
      const p = point()
      if (!p) {
        el.style.visibility = "hidden"
        return
      }
      v.set(p[0], p[1], p[2]).project(camera)
      const behind = v.z > 1
      el.style.visibility = behind ? "hidden" : "visible"
      if (behind) return
      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)${offset ? ` ${offset}` : ""}`
    })
  })
  return null
}
