// DOM half of the pixel-grain crawl (spike D1): a tall dithered mask image that slides so the same
// ragged, pixel-stepped front that dissolves the 3D also dissolves the glass panels and text.
const CELL = 6
const COLS = 48
const SOLID = 300
const RAMP = 48

let cache: { out: string; in: string } | null = null

/** Bayer 4x4 + per-cell noise: ordered enough to read as pixels, noisy enough to feel like grain. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

function render(invert: boolean) {
  const rows = SOLID * 2 + RAMP
  const c = document.createElement("canvas")
  c.width = COLS * CELL
  c.height = rows * CELL
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#000"
  let seed = invert ? 99 : 7
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < COLS; x++) {
      // v = 1 visible, 0 hidden. "out": visible above the ramp. "in": visible below it.
      let v: number
      if (y < SOLID) v = 1
      else if (y >= SOLID + RAMP) v = 0
      else v = 1 - (y - SOLID) / RAMP
      if (invert) v = 1 - v
      const thr = BAYER[(x % 4) + (y % 4) * 4] / 16 * 0.55 + rnd() * 0.45
      if (v > thr) ctx.fillRect(x * CELL, y * CELL, CELL, CELL)
    }
  }
  return c.toDataURL("image/png")
}

export function pixelMasks() {
  if (!cache) cache = { out: render(false), in: render(true) }
  return cache
}

export const MASK_SIZE = `${COLS * CELL}px ${(SOLID * 2 + RAMP) * CELL}px`
/** Pixel offset of the ramp centre from the top of the mask image. */
export const MASK_CENTER = (SOLID + RAMP / 2) * CELL

/**
 * Apply the crawl to an element. `front` is the viewport-relative front height (0 = bottom, 1 = top);
 * `mode` "out" hides what the front has passed, "in" reveals it.
 */
export function applyCrawl(el: HTMLElement, front: number | null, mode: "out" | "in") {
  if (front === null) {
    el.style.maskImage = ""
    el.style.webkitMaskImage = ""
    return
  }
  const m = pixelMasks()
  const rect = el.getBoundingClientRect()
  const yFront = window.innerHeight * (1 - front) - rect.top
  const img = `url(${mode === "out" ? m.out : m.in})`
  el.style.maskImage = img
  el.style.webkitMaskImage = img
  el.style.maskSize = MASK_SIZE
  el.style.setProperty("-webkit-mask-size", MASK_SIZE)
  el.style.maskRepeat = "repeat-x"
  el.style.setProperty("-webkit-mask-repeat", "repeat-x")
  const pos = `0px ${Math.round(yFront - MASK_CENTER)}px`
  el.style.maskPosition = pos
  el.style.setProperty("-webkit-mask-position", pos)
}
