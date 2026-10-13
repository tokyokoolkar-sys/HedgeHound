import type { Look } from "@/lib/motion/choreo"

/** Write a Look to an element (opacity, rise in px, blur). Clears filters/transforms at rest. */
export function applyLook(el: HTMLElement | null, look: Look, hideWhenZero = true) {
  if (!el) return
  el.style.opacity = String(look.opacity)
  if (hideWhenZero) el.style.visibility = look.opacity <= 0.001 ? "hidden" : "visible"
  el.style.filter = look.blur > 0.05 ? `blur(${look.blur.toFixed(2)}px)` : ""
  el.style.transform = Math.abs(look.y) > 0.05 ? `translate3d(0, ${look.y.toFixed(1)}px, 0)` : ""
}
