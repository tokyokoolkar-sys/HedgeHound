// Projected labels (PLAN §4.1.6): plain page DOM pinned to a 3D point, positioned by SkyStage every frame.
// Unlike drei <Html>, nothing here mounts its own React root, so refreshing data can't orphan a copy.

export type Point3 = [number, number, number]

export type Projected = {
  el: HTMLElement
  /** World-space point, read every frame (objects may move). */
  point: () => Point3 | null
  /** Extra CSS transform after the pin, e.g. "translate(0, -50%)" to centre vertically. */
  offset?: string
}

export const projected = new Set<Projected>()

export function registerProjected(p: Projected) {
  projected.add(p)
  return () => void projected.delete(p)
}
