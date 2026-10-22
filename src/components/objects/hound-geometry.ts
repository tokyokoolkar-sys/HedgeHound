// The glass hound's geometry. Extruding the deeply bevelled silhouette is the single most expensive step of
// the sky's boot (M0 Lighthouse: ~350 ms in one task), so it runs in a worker: the main thread parses the SVG
// into shapes (cheap, and SVGLoader needs DOMParser, which workers lack), the worker extrudes them and sends
// back the vertex arrays. If the worker can't start, the same function runs here.
import * as THREE from "three"
import { SVGLoader } from "three-stdlib"
import type { Quality } from "@/lib/stage/store"

const HOUND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M10 60C11 50 14 41 18.5 35.5 20.8 32.6 20.2 29.6 19.2 26.4 18.2 21.5 19.4 15.4 22.6 8.6 23.2 7.2 24.2 6.8 25 7.6 28.6 11.2 30.8 16.2 31.6 21.4 32 24 33.4 25.4 35.8 26.2 38.4 27 40.4 28.4 43.4 29.2L54 31.6C57.4 32.4 59.4 33.8 59.4 36 59.4 38.4 57.4 39.6 54.6 39.8L48.6 40.2C45.4 40.6 43.4 42 42.6 44.4 41.8 47.4 42 51 42.6 54.2 43.2 57 44.2 59 45.8 60Z"/></svg>`

// PLAN §7: curve segments per tier.
const SEGMENTS: Record<Quality, { curve: number; bevel: number }> = {
  high: { curve: 72, bevel: 24 },
  mid: { curve: 40, bevel: 14 },
  low: { curve: 24, bevel: 8 },
}

export type HoundRequest = { id: number; shapes: unknown[]; quality: Quality }
export type HoundArrays = { position: Float32Array; normal: Float32Array }

/** Main thread: the silhouette as serialisable shapes. */
export function houndShapesJSON(): unknown[] {
  const data = new SVGLoader().parse(HOUND_SVG)
  return data.paths
    .flatMap((p) => SVGLoader.createShapes(p as unknown as Parameters<typeof SVGLoader.createShapes>[0]))
    .map((s) => s.toJSON())
}

/** Either thread: extrude the shapes into the hound's final (centred, flipped, scaled) vertex arrays. */
export function extrudeHound(shapesJSON: unknown[], quality: Quality): HoundArrays {
  const shapes = shapesJSON.map((j) => new THREE.Shape().fromJSON(j as Parameters<THREE.Shape["fromJSON"]>[0]))
  // Deep, soft bevel so every edge reads as rounded glass rather than a cut-out.
  const g = new THREE.ExtrudeGeometry(shapes, {
    depth: 4,
    bevelEnabled: true,
    bevelThickness: 4.2,
    bevelSize: 2.6,
    bevelSegments: SEGMENTS[quality].bevel,
    curveSegments: SEGMENTS[quality].curve,
  })
  g.center()
  // Flip y for SVG coordinates, and z too: one negative axis would reverse the winding (we would see the
  // inside faces with inverted normals, which drew a hard white line along the base; T15 critique).
  g.scale(0.062, -0.062, -0.062)
  g.computeVertexNormals()
  const out = {
    position: g.getAttribute("position").array as Float32Array,
    normal: g.getAttribute("normal").array as Float32Array,
  }
  g.dispose()
  return out
}

/** Arrays → a BufferGeometry on the main thread. */
export function houndGeometry({ position, normal }: HoundArrays): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.BufferAttribute(position, 3))
  g.setAttribute("normal", new THREE.BufferAttribute(normal, 3))
  g.computeBoundingSphere()
  return g
}
