// The α→β crawl's carousel (DESIGN.md "Symbol carousel"): at full grain, the coins the hound is watching
// cycle in groups of five with @spell/logos-carousel's staggered rise. Each shows its net APR (orange if
// alerting, dim while building history) under one LIVE/SAMPLE tag. The featured coin (β's reading) is
// left out. Its visibility follows the crawl progress; the cycling itself is ambient (owner-chosen).
import { useMemo, useRef } from "react"
import { LogosCarousel } from "@/components/logos-carousel"
import { cn } from "@/lib/cn"
import { band } from "@/lib/motion/math"
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

  useScrollFrame((s) => {
    const c = s.sections[section] ?? 0
    // Reduced motion: no crawl to hide behind, so the first five simply sit there while the section passes.
    if (s.reduced) return applyLook(ref.current, { opacity: c > 0.26 && c < 0.74 ? 1 : 0, y: 0, blur: 0 })
    const o = band(c, 0.26, 0.38) * (1 - band(c, 0.62, 0.74))
    applyLook(ref.current, { opacity: o, y: (1 - o) * 16, blur: (1 - o) * 3 })
  })

  const reduced = useReducedMotion()
  if (rows.length === 0) return null
  const coin = (r: (typeof rows)[number]) => (
    <span key={r.symbol} className="inline-flex flex-col items-center gap-1.5">
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
        <div className="flex gap-5 sm:gap-10">{rows.slice(0, 5).map(coin)}</div>
      ) : (
        <LogosCarousel count={5} stagger={0.12} interval={2200} duration={700} className="gap-5 sm:gap-10">
          {rows.map(coin)}
        </LogosCarousel>
      )}
      <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
    </div>
  )
}
