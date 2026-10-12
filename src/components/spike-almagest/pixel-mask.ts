// DOM half of the grain crawl (spike D1): masks that make the glass cards get eaten (and rebuilt)
// by the same bites as the 3D, plus the random-pixel reveal for cards. Everything is scroll-driven.
// Bite frames: the same "eating" as the 3D crawl. Each cell has a fixed random moment; as the front
// passes, cells are bitten out (big bites + small crumbs) and stay out. The scroll picks the frame.
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

// ---------------------------------------------------------------- pixel reveal (cards)
// A card resolves out of random pixels as you scroll: a few cells, then more, then all of it.
// 32 precomputed tiles at increasing coverage; the scroll picks the tile, so it never animates alone.
const R_CELL = 5
const R_TILE = 40
const R_FRAMES = 32
let revealCache: string[] | null = null

export function revealFrames() {
  if (revealCache) return revealCache
  let seed = 4242
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  const rank = Array.from({ length: R_TILE * R_TILE }, () => rnd())
  revealCache = Array.from({ length: R_FRAMES }, (_, k) => {
    const coverage = Math.pow((k + 1) / R_FRAMES, 2.2)
    const c = document.createElement("canvas")
    c.width = c.height = R_TILE * R_CELL
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#000"
    rank.forEach((r, i) => {
      if (r < coverage) ctx.fillRect((i % R_TILE) * R_CELL, Math.floor(i / R_TILE) * R_CELL, R_CELL, R_CELL)
    })
    return c.toDataURL("image/png")
  })
  return revealCache
}

/** p: 0 hidden → 1 fully shown, stepping through random-pixel coverage. Returns true if visible at all. */
export function applyReveal(el: HTMLElement, p: number) {
  if (p >= 1) {
    el.style.maskImage = ""
    el.style.webkitMaskImage = ""
    el.style.visibility = "visible"
    return true
  }
  if (p <= 0) {
    el.style.visibility = "hidden"
    return false
  }
  const frames = revealFrames()
  const img = `url(${frames[Math.min(R_FRAMES - 1, Math.floor(p * R_FRAMES))]})`
  el.style.visibility = "visible"
  el.style.maskImage = img
  el.style.webkitMaskImage = img
  el.style.maskSize = `${R_TILE * R_CELL}px`
  el.style.setProperty("-webkit-mask-size", `${R_TILE * R_CELL}px`)
  el.style.maskRepeat = "repeat"
  el.style.setProperty("-webkit-mask-repeat", "repeat")
  el.style.maskPosition = "0 0"
  el.style.setProperty("-webkit-mask-position", "0 0")
  return true
}

// ---------------------------------------------------------------- resolve (callout card)
// The card emerges from the star field: first a scatter of pixels, then it fills in as big blocks and
// sharpens step by step (roughly 240p → 480p → 720p → crisp). Pixelation is an SVG filter
// (#a-pixelate, defined once on the page) whose block size the scroll steps down.
const BLOCKS = [24, 16, 12, 8, 5, 3, 2]

function setBlock(size: number) {
  const f = document.getElementById("a-pixelate")
  if (!f) return
  const flood = f.querySelector("feFlood")
  const comp = f.querySelector("feComposite[data-tile]")
  const morph = f.querySelector("feMorphology")
  const half = String(Math.floor(size / 2))
  flood?.setAttribute("x", half)
  flood?.setAttribute("y", half)
  comp?.setAttribute("width", String(size))
  comp?.setAttribute("height", String(size))
  morph?.setAttribute("radius", String(size / 2))
}

// Grow frames: cells appear in order of distance from the origin (where the leader line meets the
// card), with a slightly ragged edge, so the card spreads out of the line evenly until it is full size.
const GROW_FRAMES = 40
const GROW_CELL = 5
const growCache = new Map<string, Array<string | undefined>>()

function growFrame(w: number, h: number, ox: number, oy: number, k: number) {
  const key = `${w}x${h}@${ox},${oy}`
  let frames = growCache.get(key)
  if (!frames) growCache.set(key, (frames = new Array(GROW_FRAMES)))
  const hit = frames[k]
  if (hit) return hit
  const maxD = Math.max(Math.hypot(ox, oy), Math.hypot(w - ox, oy), Math.hypot(ox, h - oy), Math.hypot(w - ox, h - oy))
  const t = (k + 1) / GROW_FRAMES
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#000"
  for (let y = 0; y < h; y += GROW_CELL) {
    for (let x = 0; x < w; x += GROW_CELL) {
      const d = Math.hypot(x + GROW_CELL / 2 - ox, y + GROW_CELL / 2 - oy) / maxD
      const jitter = cellRand(x / GROW_CELL, y / GROW_CELL, 29)
      if (d <= t * 1.12 - jitter * 0.12) ctx.fillRect(x, y, GROW_CELL, GROW_CELL)
    }
  }
  return (frames[k] = c.toDataURL("image/png"))
}

/**
 * The card grows out of the leader line: pixels spread evenly from the attach point (left-middle,
 * or top-centre when docked below) to full size, starting coarse and sharpening to crisp.
 */
export function applyResolve(el: HTMLElement, p: number, origin: "left" | "top" = "left") {
  if (p <= 0) {
    el.style.visibility = "hidden"
    return
  }
  el.style.visibility = "visible"
  const w = Math.max(1, Math.round(el.offsetWidth))
  const h = Math.max(1, Math.round(el.offsetHeight))
  const grow = Math.min(1, p / 0.7)
  if (grow < 1) {
    const ox = origin === "left" ? 0 : Math.round(w / 2)
    const oy = origin === "left" ? Math.round(h / 2) : 0
    const img = `url(${growFrame(w, h, ox, oy, Math.min(GROW_FRAMES - 1, Math.floor(grow * GROW_FRAMES)))})`
    el.style.maskImage = img
    el.style.webkitMaskImage = img
    el.style.maskSize = `${w}px ${h}px`
    el.style.setProperty("-webkit-mask-size", `${w}px ${h}px`)
    el.style.maskRepeat = "no-repeat"
    el.style.setProperty("-webkit-mask-repeat", "no-repeat")
  } else {
    el.style.maskImage = ""
    el.style.webkitMaskImage = ""
  }
  if (p >= 0.96) {
    el.style.filter = ""
    return
  }
  // Coarse while it grows, sharpening as it reaches full size.
  const k = Math.min(BLOCKS.length - 1, Math.floor((p / 0.96) * BLOCKS.length))
  setBlock(BLOCKS[k])
  el.style.filter = "url(#a-pixelate)"
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
