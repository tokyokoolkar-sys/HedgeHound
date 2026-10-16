// Extrudes the glass hound off the main thread (see hound-geometry.ts).
import { extrudeHound, type HoundRequest } from "./hound-geometry"

self.onmessage = (e: MessageEvent<HoundRequest>) => {
  const { id, shapes, quality } = e.data
  const out = extrudeHound(shapes, quality)
  ;(self as unknown as Worker).postMessage({ id, ...out }, [out.position.buffer, out.normal.buffer])
}
