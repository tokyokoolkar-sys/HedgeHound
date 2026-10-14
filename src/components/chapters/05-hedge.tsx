// ε The Hedge (PLAN §3 ε, TICKETS T22), on the β–δ pattern. Owner decisions: (a) the field chart as the
// instrument, (b) a shortlist of eight, clean first, (c) "Open scanner" under the shortlist (added in T31).
// - copy: <Chapter> (what makes a spread worth taking), then a live second beat: the shortlist as ruled
//   text rows on the sky, one SourceTag;
// - instrument: objects/field-chart.tsx, channels in hedge-scene.ts; labels pinned to it.
import { band } from "@/lib/motion/math"
import { Link } from "@tanstack/react-router"
import { useRef, type ReactNode } from "react"
import { cn } from "@/lib/cn"
import { formatNet } from "@/lib/scan/loudest"
import { useScan } from "@/lib/scan/use-scan"
import { DEFAULT_SCAN_PARAMS, type ScanRow } from "@/lib/scan/types"
import { FIELD_H, FIELD_W, NET_TICKS, SHAKY_BELOW, fieldLabelSide, fieldToWorld, labelled, netX, placeField, shortlist, tickText } from "@/lib/stage/field"
import { INSTRUMENT_EXTENT } from "@/lib/stage/layout"
import type { ChapterDef } from "@/content/edition"
import { useInstrumentLayout } from "../objects/use-radar"
import { Beat } from "../edition/beat"
import { Chapter } from "../edition/chapter"
import { applyLook } from "../edition/look"
import { ProjectedLabel } from "../edition/projected-label"
import { SourceTag } from "../edition/source-tag"
import { useScrollFrame } from "../edition/use-scroll-frame"

type Props = { def: ChapterDef; exitInto?: string; last?: boolean }

/** A shortlist row: net APR and status, then the two legs and how much it held. */
function rowValue(r: ScanRow): ReactNode {
  const ok = r.status === "ok"
  return (
    <span className="grid gap-1 pt-0.5">
      <span className="flex items-baseline gap-3">
        <span className={cn("figure", ok ? "text-scent" : "text-starlight")}>{formatNet(r.net_apr)}</span>
        <span className="label text-starlight-dim">{ok ? "clean" : "building history"}</span>
        {r.persistence < SHAKY_BELOW && <span className="label text-starlight">shaky</span>}
      </span>
      <span className="label text-starlight-dim">
        long {r.long} · short {r.short} · held {Math.round(r.persistence * 100)}%
      </span>
    </span>
  )
}

export function Hedge({ def, exitInto, last }: Props) {
  const scan = useScan()
  // Phones show five rows, so the list never runs under the HUD.
  const list = shortlist(scan.rows, useInstrumentLayout().mode === "narrow" ? 5 : 8)
  const tag = <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
  const footer = (
    <span className="flex flex-wrap items-baseline gap-3">
      {tag}
      <span className="label text-starlight-dim">net after costs at a {DEFAULT_SCAN_PARAMS.hold} h hold</span>
    </span>
  )

  return (
    <>
      <Chapter def={def} exitInto={exitInto} last={last} />
      {def.beat && list.length > 0 && (
        <Beat
          section={def.id}
          beat={def.beat}
          letter={def.letter ?? ""}
          stacked={def.stacked && { in: def.stacked.beatIn, out: def.stacked.beatOut }}
          rows={list.map((r) => [r.symbol, rowValue(r)])}
          footer={footer}
          action={
            <Link to="/scanner" className="label inline-flex min-h-11 items-center text-starlight underline decoration-starlight-faint decoration-1 underline-offset-[6px] hover:decoration-starlight focus-visible:text-scan">
              Open scanner →
            </Link>
          }
        />
      )}
      {/* The shortlist as text for screen readers (the beat above is visual only). */}
      {def.beat && list.length > 0 && (
        <div className="sr-only">
          <h3>{def.beat.title}</h3>
          <ul>
            {list.map((r) => (
              <li key={r.symbol}>
                {r.symbol}: {formatNet(r.net_apr)} net APR after costs, {r.status === "ok" ? "clean" : "building history"}, long {r.long}, short{" "}
                {r.short}, held {Math.round(r.persistence * 100)}% of the last 6 hours
              </li>
            ))}
          </ul>
          <p>{scan.live ? "Live reading from the local scanner" : "Sample data, not a live reading"}</p>
        </div>
      )}
      <FieldLabels rows={scan.rows} tag={tag} />
    </>
  )
}

function FieldLabels({ rows, tag }: { rows: ScanRow[]; tag: ReactNode }) {
  const layout = useInstrumentLayout()
  const axis = useRef<HTMLDivElement>(null)
  const coins = useRef<HTMLDivElement>(null)
  const stars = placeField(rows)
  const top = labelled(stars, layout.labels)

  useScrollFrame((s) => {
    const sc = s.scene
    // Axis text only once the chart is featured (stacked layouts keep the tucked axes quiet).
    applyLook(axis.current, { opacity: sc.fieldAppear * band(sc.fieldFocus, 0.8, 1) * (1 - band(sc.fieldAway, 0, 0.3)) * sc.fieldOn, y: 0, blur: 0 })
    applyLook(coins.current, { opacity: sc.fieldLabels, y: 0, blur: 0 })
  })

  if (stars.length === 0) return null
  return (
    <>
      <div ref={axis} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2]" style={{ visibility: "hidden" }}>
        {NET_TICKS.map((n) => (
          <ProjectedLabel key={n} point={() => fieldToWorld(netX(n), -FIELD_H - 0.18)} offset="translate(-50%, 0)" className="label whitespace-nowrap text-starlight-dim">
            {tickText(n)}
          </ProjectedLabel>
        ))}
        <ProjectedLabel point={() => fieldToWorld(FIELD_W, -FIELD_H - 0.62)} offset="translate(-100%, 0)" className="label whitespace-nowrap text-starlight-dim">
          net APR after costs, % →
        </ProjectedLabel>
        <ProjectedLabel point={() => fieldToWorld(-FIELD_W, FIELD_H + 0.12)} offset="translate(0, -100%)" className="label whitespace-nowrap text-starlight-dim">
          ↑ held 6 h
        </ProjectedLabel>
        {/* Starts at the break-even line and runs right, clear of the "held" title on the left. */}
        <ProjectedLabel point={() => fieldToWorld(netX(0), FIELD_H + 0.12)} offset="translate(6px, -100%)" className="label whitespace-nowrap text-starlight-dim">
          <span className="whitespace-nowrap">break-even</span>
        </ProjectedLabel>
        {/* Caption: names the chart and tags its figures. */}
        <ProjectedLabel
          point={() => fieldToWorld(-INSTRUMENT_EXTENT, FIELD_H + 0.75)}
          offset="translate(0, -100%)"
          className="flex max-w-[min(80vw,340px)] flex-wrap items-baseline gap-x-3 gap-y-1 [&>*]:whitespace-nowrap"
        >
          <span className="label text-starlight-dim">
            <span className="bayer mr-1">ε</span> {stars.length} coins · net × held
          </span>
          {tag}
        </ProjectedLabel>
      </div>
      <div ref={coins} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2]" style={{ visibility: "hidden" }}>
        {/* Labels run right, away from the break-even line and the axis; near the right edge they turn back. */}
        {top.map((k) => (
          <ProjectedLabel
            key={k.symbol}
            point={() => fieldToWorld(k.x, k.y)}
            offset={fieldLabelSide(k) === "left" ? "translate(calc(-100% - 10px), -50%)" : "translate(10px, -50%)"}
            className="whitespace-nowrap"
          >
            <span className="label text-starlight-dim">{k.symbol}</span>{" "}
            <span className={cn("figure text-xs", k.ok ? "text-scent" : "text-starlight")}>{formatNet(k.net)}</span>
          </ProjectedLabel>
        ))}
      </div>
    </>
  )
}
