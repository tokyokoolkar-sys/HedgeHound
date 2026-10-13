// A points object for a star Field (geometry built once per field, disposed on change).
import { useEffect, useMemo } from "react"
import * as THREE from "three"
import type { Field } from "./star-points"

export function FieldPoints({ field, material }: { field: Field; material: THREE.ShaderMaterial }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(field.position, 3))
    g.setAttribute("aStart", new THREE.BufferAttribute(field.aStart, 3))
    g.setAttribute("aSize", new THREE.BufferAttribute(field.aSize, 1))
    g.setAttribute("aColor", new THREE.BufferAttribute(field.aColor, 3))
    g.setAttribute("aPhase", new THREE.BufferAttribute(field.aPhase, 1))
    g.setAttribute("aDelay", new THREE.BufferAttribute(field.aDelay, 1))
    return g
  }, [field])
  useEffect(() => () => geo.dispose(), [geo])
  return <points geometry={geo} material={material} frustumCulled={false} />
}
