// The α→β crawl's carousel (DESIGN.md "Symbol carousel"): the coins the hound is watching, in groups of five,
// each with its net APR (orange only when clean and paying) under one LIVE/SAMPLE tag. The featured coin (β's
// reading) is left out. Everything follows the crawl's scroll (owner, P4 close: no timer): the block arrives and
// leaves with the crawl, and the groups change with it, each leaving before the next rises (lib/motion/choreo
// groupItem). Reduced motion: the first five, still, while the crawl section passes.
import { useMemo, useRef } from "react"
import { cn } from "@/lib/cn"
import { band } from "@/lib/motion/math"
import { groupItem } from "@/lib/motion/choreo"
import { useReducedMotion } from "@/lib/motion/use-reduced-motion"
import { carouselRows, formatNet, pickLoudest } from "@/lib/scan/loudest"
import { useScan } from "@/lib/scan/use-scan"
import { SourceTag } from "./source-tag"
import { applyLook } from "./look"
import { useScrollFrame } from "./use-scroll-frame"

export function SymbolCarousel({ section }: { section: string }) {
  const scan = useScan()
  const rows = useMemo(() => carouselRows(scan.rows, pickLoudest(scan.rows)?.symbol ?? null), [scan.rows])
  const ref = useRef<HTMLDivElement>(null)
  const groups = useMemo(() => Array.from({ length: Math.ceil(rows.length / 5) }, (_, g) => rows.slice(g * 5, g * 5 + 5)), [rows])

  useScrollFrame((s) => {
    const c = s.sections[section] ?? 0
    // Reduced motion: no crawl to hide behind, so the first five simply sit there in their own slot of the
    // section (between Canis Major leaving and the radar arriving, see sniff-scene.ts and edition.tsx).
    if (s.reduced) return applyLook(ref.current, { opacity: c > 0.3 && c < 0.7 ? 1 : 0, y: 0, blur: 0 })
    const o = band(c, 0.26, 0.38) * (1 - band(c, 0.62, 0.74))
    applyLook(ref.current, { opacity: o, y: (1 - o) * 16, blur: (1 - o) * 3 })
    const u = band(c, 0.3, 0.7)
    ref.current?.querySelectorAll<HTMLElement>("[data-coin]").forEach((el) => {
      applyLook(el, groupItem(u, groups.length, Number(el.dataset.g), Number(el.dataset.k)))
    })
  })

  const reduced = useReducedMotion()
  if (rows.length === 0) return null
  const coin = (r: (typeof rows)[number], g = 0, k = 0) => (
    <span key={r.symbol} data-coin data-g={g} data-k={k} className="inline-flex flex-col items-center gap-1.5">
      <span className="label text-base tracking-[0.3em] text-starlight">{r.symbol}</span>
      <span className={cn("figure text-xs", r.alert ? "text-scent" : "text-starlight-dim")}>{formatNet(r.net)}</span>
    </span>
  )
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-x-0 top-1/2 z-10 grid -translate-y-1/2 justify-items-center gap-5 overflow-hidden px-4"
      style={{ visibility: "hidden" }}
    >
      <p className="label m-0 text-starlight-dim">
        <span className="bayer">α → β</span> · on the hound’s nose
      </p>
      {reduced ? (
        <div className="flex gap-5 sm:gap-10">{rows.slice(0, 5).map((r) => coin(r))}</div>
      ) : (
        // Every group in the same cell; only the one the scroll is on is visible.
        <div className="grid">
          {groups.map((grp, g) => (
            <div key={g} className="col-start-1 row-start-1 flex justify-center gap-5 sm:gap-10">
              {grp.map((r, k) => coin(r, g, k))}
            </div>
          ))}
        </div>
      )}
      <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
    </div>
  )
}
