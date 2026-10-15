// γ The Spread (PLAN §3 γ, TICKETS T20), built on the β reference pattern:
// - copy: <Chapter> (definition of the spread + three steps), then a live second beat: the loudest
//   scent's two legs (the same coin β just featured), every field from the scanner, one SourceTag;
// - instrument: objects/hedge-astrolabe.tsx, channels in spread-scene.ts;
// - labels pinned to the astrolabe as <ProjectedLabel>s: each leg's venue, the spread hairline, the
//   swing caption, and a caption that tags the live venue names.
import { hourlyApr } from "@/lib/scan/history"
import { heldKnown } from "@/lib/scan/table"
import { useRef, type ReactNode } from "react"
import { cn } from "@/lib/cn"
import { band } from "@/lib/motion/math"
import { formatNet, pickLoudest } from "@/lib/scan/loudest"
import { useScan } from "@/lib/scan/use-scan"
import type { ScanRow } from "@/lib/scan/types"
import { R_LONG, R_SHORT, SWING, astrolabeToWorld, legs } from "@/lib/stage/astrolabe"
import { INSTRUMENT_EXTENT } from "@/lib/stage/layout"
import { useStage } from "@/lib/stage/store"
import type { ChapterDef } from "@/content/edition"
import { Beat } from "../edition/beat"
import { Chapter } from "../edition/chapter"
import { applyLook } from "../edition/look"
import { ProjectedLabel } from "../edition/projected-label"
import { SourceTag } from "../edition/source-tag"
import { useScrollFrame } from "../edition/use-scroll-frame"

type Props = { def: ChapterDef; exitInto?: string; last?: boolean }

/** A venue's latest hourly funding as APR, when the scanner reports it (T41); nothing otherwise. */
function venueRate(r: ScanRow, venue: string): ReactNode {
  const hr = venue === "Lighter" ? r.lighter_hr : venue === "Binance" ? r.binance_hr : null
  if (hr == null) return null
  return <span className="label ml-2 tabular-nums text-starlight-dim">funding {hourlyApr(hr)} APR</span>
}

/** The live legs of one row, as label / value pairs. */
function hedgeRows(r: ScanRow): Array<[string, ReactNode]> {
  return [
    ["Coin", r.symbol],
    [
      "Long",
      <>
        <span className="text-scan">●</span> {r.long}
        {venueRate(r, r.long)}
      </>,
    ],
    [
      "Short",
      <>
        <span className="text-scent">●</span> {r.short}
        {venueRate(r, r.short)}
      </>,
    ],
    [
      "Net APR",
      <span className={cn("figure", r.status === "ok" ? "text-scent" : "text-starlight")}>{formatNet(r.net_apr)} after costs</span>,
    ],
    ["Steady", heldKnown(r) ? `${Math.round(r.persistence * 100)}% of the last 6 h held its sign and size` : `too new to say: ${r.samples} of the last 6 h's samples so far`],
    ["Since flip", r.window_h < 1 ? "under an hour of history so far" : `${r.hours_since_flip.toFixed(1)} h since the sign last flipped`],
    ["History", r.status === "ok" ? `${r.n24} samples today · clean` : `building history · ${r.n24} of 144 samples`],
  ]
}

export function Spread({ def, exitInto, last }: Props) {
  const scan = useScan()
  const loudest = pickLoudest(scan.rows)
  const row = scan.rows.find((r) => r.symbol === loudest?.symbol) ?? null
  const tag = <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
  const rows = row ? hedgeRows(row) : []

  return (
    <>
      <Chapter def={def} exitInto={exitInto} last={last} />
      {def.beat && row && (
        <Beat
          section={def.id}
          beat={def.beat}
          letter={def.letter ?? ""}
          stacked={def.stacked && { in: def.stacked.beatIn, out: def.stacked.beatOut }}
          rows={rows}
          footer={tag}
        />
      )}
      {/* The live legs as text for screen readers (the beat above is visual only). */}
      {row && def.beat && (
        <div className="sr-only">
          <h3>{def.beat.title}</h3>
          <dl>
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p>{scan.live ? "Live reading from the local scanner" : "Sample data, not a live reading"}</p>
        </div>
      )}
      {row && <AstrolabeLabels row={row} tag={tag} />}
    </>
  )
}

/** Live point on a leg, read every frame from the scene (the legs move with the scroll). */
const legPoint = (which: "long" | "short", dy: number) => () => {
  const sc = useStage.getState().scene
  const l = legs(sc.spreadSplit, sc.spreadSwing)[which]
  return astrolabeToWorld(l[0], l[1] + dy)
}

function AstrolabeLabels({ row, tag }: { row: ScanRow; tag: ReactNode }) {
  const legLabels = useRef<HTMLDivElement>(null)
  const swing = useRef<HTMLDivElement>(null)

  useScrollFrame((s) => {
    const sc = s.scene
    applyLook(legLabels.current, { opacity: sc.legLabels, y: 0, blur: 0 })
    // The swing caption holds while the price swings (static under reduced motion, with the labels).
    const o = s.reduced ? sc.legLabels : band(sc.spreadSwing, 0, 0.12) * (1 - band(sc.spreadSwing, 0.88, 1))
    applyLook(swing.current, { opacity: o, y: 0, blur: 0 })
  })

  return (
    <>
      <div ref={legLabels} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2]" style={{ visibility: "hidden" }}>
        <ProjectedLabel point={legPoint("long", R_LONG + 0.22)} offset="translate(-50%, -100%)" className="label whitespace-nowrap text-starlight-dim">
          <span className="text-scan">long</span> · {row.long}
        </ProjectedLabel>
        <ProjectedLabel point={legPoint("short", R_SHORT + 0.22)} offset="translate(-50%, -100%)" className="label whitespace-nowrap text-starlight-dim">
          <span className="text-scent">short</span> · {row.short}
        </ProjectedLabel>
        <ProjectedLabel
          point={() => {
            const sc = useStage.getState().scene
            // Centred in the open gap between the two rings, just above the hairline.
            const l = legs(sc.spreadSplit, sc.spreadSwing)
            return astrolabeToWorld((l.long[0] + R_LONG + l.short[0] - R_SHORT) / 2, l.long[1] + 0.14)
          }}
          offset="translate(-50%, -100%)"
          className="label whitespace-nowrap text-starlight-dim"
        >
          spread
        </ProjectedLabel>
        {/* Caption: names the coin and tags the live venue names above. */}
        <ProjectedLabel
          point={() => astrolabeToWorld(-INSTRUMENT_EXTENT, R_SHORT + SWING + 0.75)}
          offset="translate(0, -100%)"
          className="flex max-w-[min(80vw,340px)] flex-wrap items-baseline gap-x-3 gap-y-1 [&>*]:whitespace-nowrap"
        >
          <span className="label text-starlight-dim">
            <span className="bayer mr-1">γ</span> {row.symbol} · both legs
          </span>
          {tag}
        </ProjectedLabel>
      </div>
      <div ref={swing} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2]" style={{ visibility: "hidden" }}>
        <ProjectedLabel
          point={() => astrolabeToWorld(0, -(R_SHORT + SWING + 0.35))}
          offset="translate(-50%, 0)"
          className="label whitespace-nowrap text-starlight-dim"
        >
          price moves both legs · the gap stays
        </ProjectedLabel>
      </div>
    </>
  )
}
