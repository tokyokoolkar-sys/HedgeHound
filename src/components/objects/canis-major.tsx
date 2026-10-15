// Canis Major from real J2000 positions (DESIGN.md). Stars burst out of where the hound vanished and
// fly to their chart positions; lines draw in one after another; Bayer letters fade in. Everything is
// driven by scene channels (canisForm / canisLines / canisLabels / canisAway); nothing runs on a clock
// except star twinkle. Labels are static (their data never refreshes), so drei <Html> is safe here
// (PLAN §4.1.6), rendered into SkyStage's fixed label layer.
import { Html } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"
import { band, smooth } from "@/lib/motion/math"
import { CMA, CMA_LINES, magToPx, project } from "@/lib/stage/canis-major"
import { useStage } from "@/lib/stage/store"
import { FieldPoints } from "../stage/field-points"
import { SKY_COLORS, emptyField, rng, starColor, starMaterial } from "../stage/star-points"

/** Half the visible height at z = 0 for the default camera (z 10, fov 45). */
const HALF_H = 10 * Math.tan((45 / 2) * (Math.PI / 180))

export function CanisMajor({ labelHost }: { labelHost: HTMLElement }) {
  const portal = useMemo(() => ({ current: labelHost }), [labelHost])
  const group = useRef<THREE.Group>(null)
  const labels = useRef<Array<HTMLDivElement | null>>([])
  const { size } = useThree()
  const pos = useMemo(() => new Map(CMA.map((s) => [s.key, project(s)])), [])
  const order = useMemo(() => [...CMA].sort((a, b) => a.mag - b.mag).map((s) => s.key), [])
  // The constellation's extent in its own units (κ sizes it to fit the space above the closing lines).
  const bounds = useMemo(() => {
    const xs = [...pos.values()].map((p) => p[0])
    const ys = [...pos.values()].map((p) => p[1])
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }
  }, [pos])

  const field = useMemo(() => {
    const r = rng(5)
    const f = emptyField(CMA.length)
    CMA.forEach((s, i) => {
      const [x, y] = pos.get(s.key)!
      f.position.set([x, y, 0], i * 3)
      // Burst origin: around where the hound fell into depth.
      f.aStart.set([(r() - 0.5) * 1.6, 0.4 + (r() - 0.5) * 1.6, -18 - r() * 10], i * 3)
      f.aSize[i] = magToPx(s.mag)
      const c = s.key === "alpha" ? SKY_COLORS.star.clone().lerp(SKY_COLORS.cool, 0.35) : starColor(r())
      f.aColor.set([c.r * 1.25, c.g * 1.25, c.b * 1.25], i * 3)
      f.aPhase[i] = r()
      f.aDelay[i] = (order.indexOf(s.key) / CMA.length) * 0.42
    })
    return f
  }, [pos, order])
  const mat = useMemo(() => starMaterial({ persp: true, halo: 0.35 }), [])

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(CMA_LINES.length * 6), 3))
    return g
  }, [])
  const lineMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: SKY_COLORS.line, transparent: true, opacity: 0.42, depthWrite: false }),
    [],
  )

  useFrame(({ clock, gl }) => {
    const s = useStage.getState()
    const sc = s.scene
    const g = group.current
    if (!g) return
    g.visible = sc.canisOn > 0.5
    labels.current.forEach((el) => el && (el.style.visibility = g.visible ? "visible" : "hidden"))
    if (!g.visible) return
    const narrow = size.width < 768
    const away = sc.canisAway
    const px = s.reduced ? 0 : s.pointer[0]
    const py = s.reduced ? 0 : s.pointer[1]
    if (sc.canisPlace > 0.5) {
      // κ: the hound closes the book, centred in the space above the closing lines and sized to fit it
      // (labels run right of their stars, so a little width is kept for them).
      const viewH = 2 * HALF_H
      const viewW = viewH * (size.width / size.height)
      // Between the nav (top ~9%) and the closing lines (from 45–50%).
      const k = Math.min(((narrow ? 0.29 : 0.33) * viewH) / bounds.h, (viewW * 0.82 - (narrow ? 1.6 : 2.2)) / bounds.w)
      const yC = (0.5 - (narrow ? 0.27 : 0.29)) * viewH
      g.position.set(-bounds.cx * k - (narrow ? 0.35 : 0.5) - px * 0.1, yC - bounds.cy * k - py * 0.06, -away * 12)
      g.rotation.z = 0
      g.scale.setScalar(k)
    } else {
      // α. Narrow screens: smaller and shifted left so the right-hand labels (β Mirzam, ζ Furud) stay on screen.
      g.position.set((narrow ? -0.35 : 1.5) - px * 0.15, (narrow ? 0.9 : 0.25) - py * 0.1, -away * 12)
      g.rotation.z = away * 0.12
      g.scale.setScalar(narrow ? 0.5 : 1)
    }
    mat.uniforms.uForm.value = sc.canisForm * 1.42
    mat.uniforms.uTime.value = s.reduced ? 0 : clock.elapsedTime
    mat.uniforms.uPR.value = gl.getPixelRatio()

    // Each segment draws in sequence as `canisLines` advances.
    const arr = lineGeo.attributes.position.array as Float32Array
    CMA_LINES.forEach(([a, b], i) => {
      const pa = pos.get(a)!
      const pb = pos.get(b)!
      const t = smooth(band(sc.canisLines * CMA_LINES.length, i * 0.7, i * 0.7 + 1.6))
      arr.set([pa[0], pa[1], 0, pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, 0], i * 6)
    })
    lineGeo.attributes.position.needsUpdate = true
    // κ draws the hound small: on phones only the Greek letters fit (owner, P4 close), and on wide screens
    // Aludra's name runs to the left of its star so the Aludra–Wezen line never crosses it.
    const kappa = sc.canisPlace > 0.5
    labels.current.forEach((el, i) => {
      if (!el) return
      el.style.opacity = String(sc.canisLabels)
      const name = el.querySelector<HTMLElement>("[data-name]")
      if (name) name.style.display = kappa && narrow ? "none" : ""
      el.style.translate = kappa && !narrow && CMA[i].key === "eta" ? "calc(-100% - 0.625rem) -1.25rem" : ""
      el.style.flexDirection = kappa && !narrow && CMA[i].key === "eta" ? "row-reverse" : ""
    })
  })

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeo} material={lineMat} />
      <FieldPoints field={field} material={mat} />
      {CMA.map((s, i) => {
        const [x, y] = pos.get(s.key)!
        return (
          <Html key={s.key} portal={portal} position={[x, y, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
            <div
              ref={(el) => void (labels.current[i] = el)}
              className="flex translate-x-2.5 -translate-y-5 items-baseline gap-1.5 whitespace-nowrap"
              style={{ opacity: 0 }}
            >
              <span className="bayer">{s.bayer}</span>
              {s.name && (
                <span data-name className={`label ${s.key === "alpha" ? "text-starlight" : "text-starlight-dim"}`}>
                  {s.name}
                </span>
              )}
            </div>
          </Html>
        )
      })}
    </group>
  )
}
