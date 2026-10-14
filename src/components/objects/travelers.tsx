// "travel" handover (D2 rhythm round): the coins fly from one instrument into the next inside an act,
// locked to the scroll (lib/stage/travel.ts). β→γ→δ carry the loudest scent from the radar into the
// astrolabe and on to the comet's head; ε→ζ carry the kennel coins from the field chart into the pen;
// θ→ι carry the coins that clear your bar from the atlas into the orb. Wide layouts only (stacked ones
// take turns with copy in between), off under reduced motion.
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { KENNEL } from "@/content/edition"
import { pickLoudest } from "@/lib/scan/loudest"
import { useScan } from "@/lib/scan/use-scan"
import { arcPoint } from "@/lib/stage/comet"
import { clearsBar, pocketSpot } from "@/lib/stage/den"
import { placeField } from "@/lib/stage/field"
import { placeKennel } from "@/lib/stage/kennel"
import { instrumentLayout, layoutToWorld } from "@/lib/stage/layout"
import { placeAtlas } from "@/lib/stage/atlas"
import { placeCoins } from "@/lib/stage/radar"
import { useStage } from "@/lib/stage/store"
import { TRAVEL_SEAMS, boxToWorld, flight, flightAlpha, seamT, type Seam } from "@/lib/stage/travel"
import { SKY_COLORS } from "../stage/star-points"
import { useBook } from "./use-book"

const MAX = 48
/** Each travelling coin draws a short tail of fading points behind it, so the flight reads as motion. */
const TAIL = 5
const POINTS = MAX * (TAIL + 1)
const HALF_H = 10 * Math.tan((45 / 2) * (Math.PI / 180))

const vert = /* glsl */ `
uniform float uPR; attribute float aSize; attribute vec3 aColor; attribute float aAlpha;
varying vec3 vColor; varying float vA;
void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uPR; vColor = aColor; vA = aAlpha; }`
const frag = /* glsl */ `
varying vec3 vColor; varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d2 = dot(c, c);
  float a = min(1.0, exp(-d2 * 120.0) + exp(-d2 * 14.0) * 0.3) * smoothstep(0.5, 0.42, sqrt(d2)) * vA;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * pow(a, 2.2), 1.0);
}`

type Leg = { seam: Seam; from: (w: number, h: number) => [number, number]; to: (w: number, h: number) => [number, number]; color: THREE.Color }

export function Travelers() {
  const { size } = useThree()
  const scan = useScan()
  const { book } = useBook()
  const ref = useRef<THREE.Points>(null)

  // Every travelling coin, as a pair of spots (functions of the viewport: instruments resize with it).
  const legs = useMemo<Leg[]>(() => {
    const out: Leg[] = []
    const box = (p: [number, number]) => (w: number, h: number) => boxToWorld(layoutToWorld(instrumentLayout(w, h), w, h), p)
    const color = (ok: boolean, net: number) => (ok && net > 0 ? SKY_COLORS.scent : SKY_COLORS.star.clone().multiplyScalar(0.75))
    const loud = pickLoudest(scan.rows)
    const row = scan.rows.find((r) => r.symbol === loud?.symbol)
    if (loud && row) {
      const anchor = placeCoins(scan.rows, loud.symbol).find((k) => k.symbol === loud.symbol)
      const c = color(loud.ok, loud.net)
      if (anchor) out.push({ seam: TRAVEL_SEAMS[0], from: box([anchor.x, anchor.y]), to: box([0, 0]), color: c })
      out.push({ seam: TRAVEL_SEAMS[1], from: box([0, 0]), to: box(arcPoint(Math.min(24, row.window_h))), color: c })
    }
    const field = placeField(scan.rows)
    for (const k of placeKennel(scan.rows, KENNEL)) {
      const f = field.find((s) => s.symbol === k.symbol)
      if (f) out.push({ seam: TRAVEL_SEAMS[2], from: box([f.x, f.y]), to: box([k.x, k.y]), color: color(k.ok, k.net) })
    }
    const atlas = placeAtlas(scan.rows)
    for (const r of clearsBar(scan.rows, book)) {
      const a = atlas.find((s) => s.symbol === r.symbol)
      const spot = pocketSpot(r.symbol)
      if (a)
        out.push({
          seam: TRAVEL_SEAMS[3],
          from: (w, h) => [a.x * HALF_H * (w / h), a.y * HALF_H],
          to: box([spot[0], spot[1]]),
          color: SKY_COLORS.scent,
        })
    }
    return out.slice(0, MAX)
  }, [scan.rows, book])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(POINTS * 3), 3))
    g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(POINTS * 3), 3))
    g.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(POINTS), 1))
    // Head first, then the tail getting smaller.
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(POINTS).map((_, i) => 13 - (i % (TAIL + 1)) * 1.6), 1))
    return g
  }, [])
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uPR: { value: 1 } } }),
    [],
  )
  useEffect(() => () => geo.dispose(), [geo])

  useFrame(({ gl }) => {
    const s = useStage.getState()
    const pts = ref.current
    if (!pts) return
    const on = !s.reduced && size.width >= 768
    pts.visible = on
    if (!on) return
    const pos = geo.attributes.position.array as Float32Array
    const col = geo.attributes.aColor.array as Float32Array
    const alpha = geo.attributes.aAlpha.array as Float32Array
    alpha.fill(0)
    legs.forEach((l, i) => {
      const t = seamT(s.sections, l.seam)
      const a = flightAlpha(t)
      if (a <= 0) return
      const from = l.from(size.width, size.height)
      const to = l.to(size.width, size.height)
      for (let k = 0; k <= TAIL; k++) {
        const j = i * (TAIL + 1) + k
        const [x, y] = flight(from, to, Math.max(0, t - k * 0.018))
        pos.set([x, y, 0], j * 3)
        col.set([l.color.r, l.color.g, l.color.b], j * 3)
        alpha[j] = a * (1 - k / (TAIL + 1)) * (k === 0 ? 1 : 0.55)
      }
    })
    geo.attributes.position.needsUpdate = true
    geo.attributes.aColor.needsUpdate = true
    geo.attributes.aAlpha.needsUpdate = true
    mat.uniforms.uPR.value = gl.getPixelRatio()
  })

  return <points ref={ref} geometry={geo} material={mat} frustumCulled={false} visible={false} />
}
