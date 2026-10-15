// δ The Trail (PLAN §3 δ, TICKETS T21), on the β/γ pattern. Everything here is drawn from the scanner's
// live fields only (owner decision a; lib/stage/comet.ts): no invented history.
// - copy: <Chapter> (what "stays" means), then a live second beat: the six steadiest coins as small
//   strips, each the same 24-hour picture as the trail, with mono shorthand and one SourceTag;
// - instrument: objects/comet-trail.tsx (the loudest scent, the same coin as β and γ), channels in
//   trail-scene.ts; labels pinned to it as <ProjectedLabel>s.
import { heldKnown } from "@/lib/scan/table"
import { band } from "@/lib/motion/math"
import { useRef, type ReactNode } from "react"
import { pickLoudest } from "@/lib/scan/loudest"
import { useScan } from "@/lib/scan/use-scan"
import type { ScanRow } from "@/lib/scan/types"
import { ARC_RISE, ARC_W, ARC_Y0, DAY_H, flipped, historyPath, segments, steadiestRows, stripLabel, trailToWorld } from "@/lib/stage/comet"
import { useHistory } from "@/lib/scan/use-history"
import { INSTRUMENT_EXTENT } from "@/lib/stage/layout"
import type { ChapterDef } from "@/content/edition"
import { Beat } from "../edition/beat"
import { Chapter } from "../edition/chapter"
import { applyLook } from "../edition/look"
import { ProjectedLabel } from "../edition/projected-label"
import { SourceTag } from "../edition/source-tag"
import { useScrollFrame } from "../edition/use-scroll-frame"

type Props = { def: ChapterDef; exitInto?: string; last?: boolean }

const STRIP_W = 240

/**
 * One coin's day as a strip: 24 h ago on the left, now on the right. With the scanner's history (T41) it is the
 * measured spread about a zero line; without it, the schematic drawn from the scan's own fields (held since the
 * flip, dotted before). Starlight either way: orange stays for alerts (journal #24).
 */
function DayStrip({ row, live }: { row: ScanRow; live: boolean }) {
  const points = useHistory(row.symbol, live)
  const d = points ? historyPath(points, Date.now(), STRIP_W, 16) : null
  if (!d) return <Strip row={row} />
  return (
    <svg viewBox={`0 0 ${STRIP_W} 16`} className="block h-4 w-full max-w-[240px] overflow-visible" aria-hidden="true">
      <line x1={0} y1={8} x2={STRIP_W} y2={8} stroke="currentColor" strokeWidth={1} className="text-starlight-faint" opacity={0.5} vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.25} className="text-starlight" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** The schematic strip, from the scan's own fields. */
function Strip({ row }: { row: ScanRow }) {
  const x = (hoursAgo: number) => (1 - Math.min(DAY_H, hoursAgo) / DAY_H) * STRIP_W
  return (
    <svg viewBox={`0 0 ${STRIP_W} 12`} className="block h-3 w-full max-w-[240px]" aria-hidden="true">
      <line x1={0} y1={6} x2={STRIP_W} y2={6} stroke="currentColor" strokeWidth={1} className="text-starlight-faint" opacity={0.5} />
      {segments(row).map((sg) =>
        sg.kind === "held" ? (
          <line key="held" x1={x(sg.to)} y1={6} x2={x(sg.from)} y2={6} stroke="currentColor" strokeWidth={2} className="text-starlight" />
        ) : (
          <line key="before" x1={x(sg.to)} y1={6} x2={x(sg.from)} y2={6} stroke="currentColor" strokeWidth={1.5} strokeDasharray="2 3" className="text-starlight-faint" />
        ),
      )}
      {flipped(row) && <line x1={x(row.hours_since_flip)} y1={1} x2={x(row.hours_since_flip)} y2={11} stroke="currentColor" strokeWidth={1} className="text-starlight" />}
    </svg>
  )
}

/** The steadiest six as beat rows: symbol / strip + shorthand. */
function steadiest(rows: ScanRow[], live: boolean): Array<[string, ReactNode]> {
  return steadiestRows(rows).map((r) => [
      r.symbol,
      <span key={r.symbol} className="grid gap-1.5 pt-1">
        <DayStrip row={r} live={live} />
        <span className="label text-starlight-dim">{stripLabel(r)}</span>
      </span>,
    ])
}

export function Trail({ def, exitInto, last }: Props) {
  const scan = useScan()
  const loudest = pickLoudest(scan.rows)
  const row = scan.rows.find((r) => r.symbol === loudest?.symbol) ?? null
  const tag = <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
  const six = steadiest(scan.rows, scan.live)

  return (
    <>
      <Chapter def={def} exitInto={exitInto} last={last} />
      {def.beat && six.length > 0 && (
        <Beat
          section={def.id}
          beat={def.beat}
          letter={def.letter ?? ""}
          stacked={def.stacked && { in: def.stacked.beatIn, out: def.stacked.beatOut }}
          rows={six}
          footer={
            <span className="flex flex-wrap items-baseline gap-3">
              {tag}
              {scan.live && <span className="label tracking-wide normal-case text-starlight-dim">the line is the measured spread; the middle is zero</span>}
            </span>
          }
        />
      )}
      {/* The live strips as text for screen readers (the beat above is visual only). */}
      {def.beat && six.length > 0 && (
        <div className="sr-only">
          <h3>{def.beat.title}</h3>
          <ul>
            {steadiestRows(scan.rows).map((r) => (
              <li key={r.symbol}>
                {r.symbol}: {stripLabel(r)}
              </li>
            ))}
          </ul>
          <p>{scan.live ? "Live reading from the local scanner" : "Sample data, not a live reading"}</p>
        </div>
      )}
      {row && <TrailLabels row={row} tag={tag} />}
    </>
  )
}

function TrailLabels({ row, tag }: { row: ScanRow; tag: ReactNode }) {
  const axis = useRef<HTMLDivElement>(null)
  const marks = useRef<HTMLDivElement>(null)

  useScrollFrame((s) => {
    const sc = s.scene
    // Labels only once the trail is featured (stacked layouts keep the tucked arc quiet, like γ).
    applyLook(axis.current, { opacity: sc.trailAppear * band(sc.trailFocus, 0.8, 1) * (1 - band(sc.trailAway, 0, 0.3)) * sc.trailOn, y: 0, blur: 0 })
    applyLook(marks.current, { opacity: sc.trailMarks, y: 0, blur: 0 })
  })

  return (
    <>
      <div ref={axis} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2]" style={{ visibility: "hidden" }}>
        {/* The ends of the day sit beside the arc, so labels on the arc never meet them. */}
        <ProjectedLabel point={() => trailToWorld(-ARC_W - 0.2, ARC_Y0)} offset="translate(-100%, -50%)" className="label whitespace-nowrap text-starlight-dim">
          −24 h
        </ProjectedLabel>
        <ProjectedLabel point={() => trailToWorld(ARC_W + 0.2, ARC_Y0)} offset="translate(0, -50%)" className="label whitespace-nowrap text-starlight-dim">
          now
        </ProjectedLabel>
        <ProjectedLabel
          point={() => trailToWorld(-INSTRUMENT_EXTENT, ARC_Y0 + ARC_RISE + 0.9)}
          offset="translate(0, -100%)"
          className="flex max-w-[min(80vw,340px)] flex-wrap items-baseline gap-x-3 gap-y-1 [&>*]:whitespace-nowrap"
        >
          <span className="label text-starlight-dim">
            <span className="bayer mr-1">δ</span> {row.symbol} · the last 24 h
          </span>
          {tag}
        </ProjectedLabel>
      </div>
      <div ref={marks} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2]" style={{ visibility: "hidden" }}>
        {/* One block under the "now" end, right-aligned: when the sign last changed, and how much of the
            last six hours held. It never sits on the arc, the bracket or the end labels. */}
        <ProjectedLabel point={() => trailToWorld(ARC_W, ARC_Y0 - 0.45)} offset="translate(-100%, 0)" className="label grid justify-items-end gap-1 whitespace-nowrap text-starlight-dim">
          <span>{flipped(row) ? `last flip · ${row.hours_since_flip.toFixed(1)} h ago` : `held all ${row.window_h.toFixed(1)} h of samples`}</span>
          <span>{heldKnown(row) ? `held ${Math.round(row.persistence * 100)}% of the last 6 h` : "too new to say how much it held"}</span>
        </ProjectedLabel>
      </div>
    </>
  )
}
