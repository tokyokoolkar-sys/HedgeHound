// Pointer parallax with the D1 feel: the camera drifts a little toward the cursor and looks into the sky.
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useStage } from "@/lib/stage/store"

export function CameraRig() {
  const { camera } = useThree()
  useFrame((_, dt) => {
    const s = useStage.getState()
    const px = s.reduced ? 0 : s.pointer[0]
    const py = s.reduced ? 0 : s.pointer[1]
    camera.position.x = THREE.MathUtils.damp(camera.position.x, px * 0.45, 2.5, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, py * 0.28, 2.5, dt)
    camera.lookAt(0, 0, -4)
  })
  return null
}
