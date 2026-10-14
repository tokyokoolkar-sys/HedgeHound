// β Sniff, the reference chapter (PLAN §3, TICKETS T15). Copy patterns for P3 chapters start here:
// - the copy is a <Chapter> (first beat) plus a <Beat> that takes its place (second beat);
// - the instrument lives in SkyStage (objects/radar.tsx) and reads scene channels mapped in
//   sniff-scene.ts (composed by edition.tsx);
// - anything pinned to the instrument is a <ProjectedLabel> (never drei <Html> for refreshing data);
// - every figure carries a SourceTag; the reading gathers out of star specks at the end of its leader line.
import { useRef } from "react"
import { cn } from "@/lib/cn"
import { band } from "@/lib/motion/math"
import { formatNet } from "@/lib/scan/loudest"
import { R_OUT, dockFor, radarToWorld, topCoins } from "@/lib/stage/radar"
import type { ChapterDef } from "@/content/edition"
import { useRadar, useRadarLayout } from "../objects/use-radar"
import { Beat } from "../edition/beat"
import { Chapter } from "../edition/chapter"
import { applyLook } from "../edition/look"
import { ProjectedLabel } from "../edition/projected-label"
import { SourceTag } from "../edition/source-tag"
import { Stardust } from "../edition/stardust"
import { useScrollFrame } from "../edition/use-scroll-frame"

type Props = { def: ChapterDef; exitInto?: string; last?: boolean }

export function Sniff({ def, exitInto, last }: Props) {
  return (
    <>
      <Chapter def={def} exitInto={exitInto} last={last} />
      {def.beat && (
        <Beat
          section={def.id}
          beat={def.beat}
          letter={def.letter ?? ""}
          stacked={def.stacked && { in: def.stacked.beatIn, out: def.stacked.beatOut }}
        />
      )}
      <RadarLabels />
    </>
  )
}

/** Coin labels, the radar's caption and key, the half captions and the reading, pinned to the radar. */
function RadarLabels() {
  const { scan, placed, anchor, loudest } = useRadar()
  const layout = useRadarLayout()
  const labels = useRef<HTMLDivElement>(null)
  const top = topCoins(placed, loudest?.symbol ?? null, layout.labels)
  const dock = anchor ? dockFor(anchor, layout.dock) : null
  const below = layout.dock === "below"
  const compact = layout.r < 180
  const tag = <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />

  useScrollFrame((s) => {
    applyLook(labels.current, { opacity: s.scene.radarLabels, y: 0, blur: 0 })
  })

  return (
    <>
      <div ref={labels} className="pointer-events-none fixed inset-0 z-[2]" style={{ visibility: "hidden" }}>
        {/* Labels point inward, so the ones on the right half never run off the edge. */}
        {top.map((k) => (
          <ProjectedLabel
            key={k.symbol}
            point={() => radarToWorld(k.x, k.y)}
            offset={k.x > 0 ? "translate(calc(-100% - 10px), -50%)" : "translate(10px, -50%)"}
            className="whitespace-nowrap"
          >
            <span className="label text-starlight-dim">{k.symbol}</span>{" "}
            <span className={cn("figure text-xs", k.ok ? "text-scent" : "text-starlight")}>{formatNet(k.net)}</span>
          </ProjectedLabel>
        ))}
        {/* The halves: which venue carries the short leg (two lines on small rings, so they never meet). */}
        <ProjectedLabel point={() => radarToWorld(-R_OUT + 0.15, 0.12)} offset="translate(0, -100%)" className="label whitespace-nowrap text-starlight-dim">
          ◂ short{compact ? <br /> : " "}Binance
        </ProjectedLabel>
        <ProjectedLabel
          point={() => radarToWorld(R_OUT - 0.15, 0.12)}
          offset="translate(-100%, -100%)"
          className="label text-right whitespace-nowrap text-starlight-dim"
        >
          short{compact ? <br /> : " "}Lighter ▸
        </ProjectedLabel>
        {/* Caption + key: names the instrument, tags its figures, and says how to read it. */}
        <ProjectedLabel point={() => radarToWorld(-R_OUT, R_OUT + 0.3)} offset="translate(0, -100%)" className={cn("grid gap-1.5", !compact && "whitespace-nowrap")} style={compact ? { width: Math.max(260, layout.r * 2.1) } : undefined}>
          <span className="flex items-baseline gap-3">
            <span className="label text-starlight-dim">
              <span className="bayer mr-1">β</span> radar · {placed.length} coins
            </span>
            {tag}
          </span>
          <span className="label text-starlight-dim">
            centre = louder · ring = break-even ·{" "}
            <span className="whitespace-nowrap">
              <span className="text-scent">●</span> clean scent
            </span>
          </span>
        </ProjectedLabel>
      </div>
      {loudest && dock && (
        <ProjectedLabel
          point={() => radarToWorld(dock[0], dock[1])}
          offset={below ? "translate(-50%, 8px)" : "translate(0, -50%)"}
          className="z-[2]"
        >
          <Stardust progress={(s) => band(s.scene.reading, 0.3, 1)} className={cn("whitespace-nowrap", below ? "text-center" : "pl-3")}>
            <p className="label m-0 text-starlight-dim">{loudest.ok ? "Loudest clean scent" : "Loudest · building history"}</p>
            <p className="m-0 mt-1 font-light-display text-title text-starlight">{loudest.symbol}</p>
            <div className={cn("mt-1.5 flex items-baseline gap-3", below && "justify-center")}>
              <span className={cn("figure", loudest.ok ? "text-scent" : "text-starlight")}>{formatNet(loudest.net)} net APR</span>
              {tag}
            </div>
          </Stardust>
        </ProjectedLabel>
      )}
    </>
  )
}
