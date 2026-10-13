// DOM masks for scroll-locked text effects (DESIGN.md). Ported from D1. Everything here is driven by a
// progress value the caller computes from the scroll; nothing animates on its own.
//
// - applyCrawl: the DOM half of the bite crawl. Copy is eaten (and rebuilt) cell by cell by the same
//   bites as the 3D crawl (4px crumbs + 14px chunks, fixed per-cell moments, monotonic).
// - applyStardust: text gathers out of fine 2px specks, dim and slightly soft, then crisp.
//
// Rule from D1: a masked element must carry any offset itself. Never offset content inside it, or the
// mask clips everything outside the element's box.

const BITE_FRAMES = 48
const SMALL = 4
const BIG = 14
const biteCache = new Map<string, Array<string | undefined>>()

function cellRand(x: number, y: number, salt: number) {
  let h = Math.imul(x * 374761393 + y * 668265263 + salt * 2147483647, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1103515245)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function biteFrame(w: number, h: number, mode: "out" | "in", k: number) {
  const key = `${w}x${h}:${mode}`
  let frames = biteCache.get(key)
  if (!frames) biteCache.set(key, (frames = new Array(BITE_FRAMES)))
  const hit = frames[k]
  if (hit) return hit
  const band = Math.max(140, h * 0.55)
  const yFront = h + band - (k / (BITE_FRAMES - 1)) * (h + 2 * band)
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#000"
  for (let y = 0; y < h; y += SMALL) {
    // Matches the shader: hunger rises from a little ahead of the front to well behind it.
    const hunger = smoothstep(-0.3, 1.0, (y + SMALL / 2 - yFront) / band)
    const amount = mode === "out" ? hunger : 1 - hunger
    for (let x = 0; x < w; x += SMALL) {
      const big = cellRand(Math.floor(x / BIG), Math.floor(y / BIG), 17) < amount * 0.85
      const small = cellRand(x / SMALL, y / SMALL, 3) < amount
      if (!big && !small) ctx.fillRect(x, y, SMALL, SMALL)
    }
  }
  return (frames[k] = c.toDataURL("image/png"))
}

/**
 * Apply the crawl to an element. `front` is the viewport-relative front height (0 = bottom, 1 = top);
 * `mode` "out" eats what the front has passed, "in" rebuilds it.
 */
export function applyCrawl(el: HTMLElement, front: number | null, mode: "out" | "in") {
  if (front === null) {
    el.style.maskImage = ""
    el.style.webkitMaskImage = ""
    return
  }
  const rect = el.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width))
  const h = Math.max(1, Math.round(rect.height))
  const band = Math.max(140, h * 0.55)
  const yFront = window.innerHeight * (1 - front) - rect.top
  const k = Math.round(Math.min(1, Math.max(0, (h + band - yFront) / (h + 2 * band))) * (BITE_FRAMES - 1))
  const img = `url(${biteFrame(w, h, mode, k)})`
  el.style.maskImage = img
  el.style.webkitMaskImage = img
  el.style.maskSize = `${w}px ${h}px`
  el.style.setProperty("-webkit-mask-size", `${w}px ${h}px`)
  el.style.maskRepeat = "no-repeat"
  el.style.setProperty("-webkit-mask-repeat", "no-repeat")
  el.style.maskPosition = "0 0"
  el.style.setProperty("-webkit-mask-position", "0 0")
}

// ---------------------------------------------------------------- stardust (bare text)
// Subtle: text gathers out of fine 2px specks scattered like faint stars, dim and slightly soft at
// first, densifying into crisp glyphs. Scroll picks the frame; no timers.
const D_CELL = 2
const D_TILE = 80
const D_FRAMES = 32
let dustCache: string[] | null = null

function dustFrames() {
  if (dustCache) return dustCache
  let seed = 9001
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  const rank = Array.from({ length: D_TILE * D_TILE }, () => rnd())
  dustCache = Array.from({ length: D_FRAMES }, (_, k) => {
    const coverage = Math.pow((k + 1) / D_FRAMES, 1.7)
    const c = document.createElement("canvas")
    c.width = c.height = D_TILE * D_CELL
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#000"
    rank.forEach((r, i) => {
      if (r < coverage) ctx.fillRect((i % D_TILE) * D_CELL, Math.floor(i / D_TILE) * D_CELL, D_CELL, D_CELL)
    })
    return c.toDataURL("image/png")
  })
  return dustCache
}

export function applyStardust(el: HTMLElement, p: number) {
  if (p <= 0) {
    el.style.visibility = "hidden"
    return
  }
  el.style.visibility = "visible"
  el.style.opacity = String(0.35 + 0.65 * Math.min(1, p * 1.2))
  el.style.filter = p >= 0.98 ? "" : `blur(${((1 - p) * 1.6).toFixed(2)}px)`
  if (p >= 0.98) {
    el.style.maskImage = ""
    el.style.webkitMaskImage = ""
    return
  }
  const frames = dustFrames()
  const img = `url(${frames[Math.min(D_FRAMES - 1, Math.floor(p * D_FRAMES))]})`
  const size = `${D_TILE * D_CELL}px`
  el.style.maskImage = img
  el.style.webkitMaskImage = img
  el.style.maskSize = size
  el.style.setProperty("-webkit-mask-size", size)
  el.style.maskRepeat = "repeat"
  el.style.setProperty("-webkit-mask-repeat", "repeat")
}
