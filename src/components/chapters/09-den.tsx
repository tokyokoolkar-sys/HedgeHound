// ι The Den (PLAN §3 ι, TICKETS T26). Owner decisions: (a) the book's settings (PAPER) and a live count of
// what clears that bar, no invented results; (b) the orb's pocket sky is exactly those coins; (c) no "Open
// the den" link until T34 restyles /den; (d) the year of what-ifs is a one-line pointer, no numbers.
// - copy: <Chapter> (a paper desk; no order code in Phase 0), then "Your book": the settings (PAPER, or the
//   defaults, said as such) and the coins clearing the bar now (LIVE/SAMPLE);
// - instrument: objects/desk-orb.tsx, channels in den-scene.ts; one caption pinned beside it.
import { useRef, type ReactNode } from "react"
import { CAPITAL } from "@/lib/scent"
import { formatNet } from "@/lib/scan/loudest"
import { useScan } from "@/lib/scan/use-scan"
import { clearsBar } from "@/lib/stage/den"
import type { ChapterDef } from "@/content/edition"
import { useBook } from "../objects/use-book"
import { useInstrumentLayout } from "../objects/use-radar"
import { Beat } from "../edition/beat"
import { Chapter } from "../edition/chapter"
import { applyLook } from "../edition/look"
import { SourceTag } from "../edition/source-tag"
import { useScrollFrame } from "../edition/use-scroll-frame"

type Props = { def: ChapterDef; exitInto?: string; last?: boolean }

export function Den({ def, exitInto, last }: Props) {
  const scan = useScan()
  const { book, saved } = useBook()
  const clearing = clearsBar(scan.rows, book)
  const narrow = useInstrumentLayout().mode === "narrow"
  const live = <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
  const names = clearing
    .slice(0, narrow ? 3 : 5)
    .map((r) => r.symbol)
    .join(" · ")
  const rest = clearing.length - Math.min(clearing.length, narrow ? 3 : 5)

  const rows: Array<[string, ReactNode]> = [
    ["Budget", <span key="b">${CAPITAL} on paper</span>],
    ["Leverage", <span key="l">{book.lev}×, isolated</span>],
    ["Hold", <span key="h">{book.hold} h, the round trip of {book.cost}% spread across it</span>],
    ["Your bar", <span key="m">net ≥ {book.minNet}% after costs, clean coins only</span>],
    [
      "Clearing now",
      <span key="c" className="grid justify-items-start gap-1.5 pt-0.5">
        <span className="text-body">
          <span className="figure">{clearing.length}</span> {clearing.length === 1 ? "coin" : "coins"}
          {clearing[0] && (
            <>
              {" "}
              · loudest <span className="figure text-scent">{formatNet(clearing[0].net)}</span>
            </>
          )}
        </span>
        {clearing.length > 0 && (
          <span className="label text-starlight-dim">
            {names}
            {rest > 0 ? ` · +${rest} more` : ""}
          </span>
        )}
        {live}
      </span>,
    ],
  ]
  const footer = (
    <span className="grid justify-items-start gap-2">
      <SourceTag kind="paper" className="text-starlight" />
      <span className="label text-starlight-dim">{saved ? "your settings, saved in this browser" : "the defaults: nothing saved in this browser yet"}</span>
      <span className="label text-starlight-dim">a year of what-ifs runs in the den: a simulation, not a forecast</span>
    </span>
  )

  return (
    <>
      <Chapter def={def} exitInto={exitInto} last={last} />
      {def.beat && (
        <Beat
          section={def.id}
          beat={def.beat}
          letter={def.letter ?? ""}
          stacked={def.stacked && { in: def.stacked.beatIn, out: def.stacked.beatOut }}
          rows={rows}
          footer={footer}
        />
      )}
      {/* The book as text for screen readers (the beat above is visual only). */}
      {def.beat && (
        <div className="sr-only">
          <h3>{def.beat.title}</h3>
          <p>
            Paper book ({saved ? "your saved settings" : "defaults"}): ${CAPITAL} budget, {book.lev}× leverage, {book.hold} hour hold, {book.cost}% round trip,
            bar at {book.minNet}% net. {clearing.length} coins clear it now{clearing.length ? `: ${clearing.map((r) => r.symbol).join(", ")}` : ""}.
          </p>
          <p>{scan.live ? "Live reading from the local scanner" : "Sample data, not a live reading"}</p>
        </div>
      )}
      <OrbCaption count={clearing.length} minNet={book.minNet} hold={book.hold} tag={live} />
    </>
  )
}

/** A fixed caption under the orb's column: what the pocket sky holds. */
function OrbCaption({ count, minNet, hold, tag }: { count: number; minNet: number; hold: number; tag: ReactNode }) {
  const layout = useInstrumentLayout()
  const ref = useRef<HTMLDivElement>(null)
  useScrollFrame((s) => applyLook(ref.current, { opacity: s.scene.denLabels, y: 0, blur: 0 }))
  const top = layout.cy - layout.r - 64
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="label pointer-events-none fixed z-[2] grid -translate-x-1/2 justify-items-center gap-1.5 whitespace-nowrap text-starlight-dim"
      style={{ left: layout.cx, top: Math.max(72, top), visibility: "hidden" }}
    >
      <span className="flex items-baseline gap-3">
        <span>
          <span className="bayer mr-1">ι</span> {count} {count === 1 ? "coin clears" : "coins clear"} your bar
        </span>
        {tag}
      </span>
      <span>
        net ≥ {minNet}% at a {hold} h hold
      </span>
    </div>
  )
}
