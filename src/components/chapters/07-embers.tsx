// η Cold Embers (PLAN §3 η, TICKETS T24), on the β–ζ pattern. Owner decisions: (a) the embers fall with
// the scroll, (b) warm starlight cooling to grey (orange stays for alerts), (c) one line per reason,
// pointing back to β's rules.
// - copy: <Chapter> (skipping is the scanner doing its job), then a live second beat: one ruled row per
//   reason with the count, the reason and the first names, one SourceTag;
// - instrument: objects/ember-field.tsx, channels in embers-scene.ts; labels pinned to it.
import { band } from "@/lib/motion/math"
import { useRef, type ReactNode } from "react"
import { useScan } from "@/lib/scan/use-scan"
import { EMBER_REASONS } from "@/lib/scent"
import { EMBER_CAP, REASONS, REASON_TITLE, STREAM_X, TOP_Y, emberAt, emberToWorld, moreThan, placeEmbers, skippedLists, type Reason } from "@/lib/stage/embers"
import { INSTRUMENT_EXTENT } from "@/lib/stage/layout"
import { useStage } from "@/lib/stage/store"
import type { ChapterDef } from "@/content/edition"
import { useInstrumentLayout } from "../objects/use-radar"
import { Beat } from "../edition/beat"
import { Chapter } from "../edition/chapter"
import { applyLook } from "../edition/look"
import { ProjectedLabel } from "../edition/projected-label"
import { SourceTag } from "../edition/source-tag"
import { useScrollFrame } from "../edition/use-scroll-frame"

type Props = { def: ChapterDef; exitInto?: string; last?: boolean }

const KEY: Record<Reason, string> = { zero: "Zero rate", young: "Young", thin: "Thin book" }

/** First few names in mono, plus an honest count of the rest. */
function names(list: Array<{ symbol: string; note: string | null }>, n = 6) {
  const shown = list.slice(0, n).map((c) => (c.note ? `${c.symbol} (${c.note})` : c.symbol))
  const rest = moreThan(list.length, n)
  return shown.join(" · ") + (rest ? ` · +${rest} more` : "")
}

export function Embers({ def, exitInto, last }: Props) {
  const scan = useScan()
  const lists = skippedLists(scan.meta)
  const total = REASONS.reduce((n, r) => n + lists[r].length, 0)
  const tag = <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
  const rows: Array<[string, ReactNode]> = REASONS.map((r) => [
    KEY[r],
    <span key={r} className="grid gap-1 pt-0.5">
      <span className="text-body">
        <span className="figure">{lists[r].length}</span> {lists[r].length === 1 ? "coin" : "coins"}
      </span>
      <span className="text-body text-starlight-dim">{EMBER_REASONS[r]}</span>
      {lists[r].length > 0 && <span className="label text-starlight-dim">{names(lists[r])}</span>}
    </span>,
  ])

  return (
    <>
      <Chapter def={def} exitInto={exitInto} last={last} />
      {def.beat && total > 0 && (
        <Beat
          section={def.id}
          beat={def.beat}
          letter={def.letter ?? ""}
          stacked={def.stacked && { in: def.stacked.beatIn, out: def.stacked.beatOut }}
          rows={rows}
          footer={tag}
        />
      )}
      {/* The lists as text for screen readers (the beat above is visual only). */}
      {def.beat && total > 0 && (
        <div className="sr-only">
          <h3>{def.beat.title}</h3>
          <ul>
            {REASONS.map((r) => (
              <li key={r}>
                {KEY[r]}: {lists[r].length} coins. {EMBER_REASONS[r]} {names(lists[r], 20)}
              </li>
            ))}
          </ul>
          <p>{scan.live ? "Live reading from the local scanner" : "Sample data, not a live reading"}</p>
        </div>
      )}
      {total > 0 && <EmberLabels tag={tag} />}
    </>
  )
}

function EmberLabels({ tag }: { tag: ReactNode }) {
  const scan = useScan()
  const narrow = useInstrumentLayout().mode === "narrow"
  const cap = narrow ? 8 : EMBER_CAP
  const lists = skippedLists(scan.meta)
  const embers = placeEmbers(scan.meta, cap)
  // One named ember per stream; the rest stay anonymous sparks (their names are in the beat).
  const named = REASONS.flatMap((r) => embers.filter((e) => e.reason === r).slice(0, 1))
  const heads = useRef<HTMLDivElement>(null)
  const sparks = useRef<HTMLDivElement>(null)

  useScrollFrame((s) => {
    const sc = s.scene
    applyLook(heads.current, { opacity: sc.emberAppear * band(sc.emberFocus, 0.8, 1) * (1 - band(sc.emberAway, 0, 0.3)) * sc.emberOn, y: 0, blur: 0 })
    applyLook(sparks.current, { opacity: sc.emberLabels, y: 0, blur: 0 })
  })

  return (
    <>
      <div ref={heads} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2]" style={{ visibility: "hidden" }}>
        {REASONS.map((r) => (
          <ProjectedLabel key={r} point={() => emberToWorld(STREAM_X[r], TOP_Y + 0.75)} offset="translate(-50%, 0)" className="label grid justify-items-center whitespace-nowrap text-starlight-dim">
            <span>
              {REASON_TITLE[r]} · <span className="figure text-starlight">{lists[r].length}</span>
            </span>
            {moreThan(lists[r].length, cap) > 0 && <span>+{moreThan(lists[r].length, cap)} more</span>}
          </ProjectedLabel>
        ))}
        <ProjectedLabel point={() => emberToWorld(-INSTRUMENT_EXTENT, TOP_Y + 1.25)} offset="translate(0, -100%)" className="flex max-w-[min(80vw,340px)] flex-wrap items-baseline gap-x-3 gap-y-1 [&>*]:whitespace-nowrap">
          <span className="label text-starlight-dim">
            <span className="bayer mr-1">η</span> skipped on purpose
          </span>
          {tag}
        </ProjectedLabel>
      </div>
      <div ref={sparks} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2]" style={{ visibility: "hidden" }}>
        {named.map((e) => (
          <ProjectedLabel
            key={e.symbol}
            point={() => {
              const at = emberAt(e, useStage.getState().scene.emberFall)
              return emberToWorld(at.x, at.y)
            }}
            offset="translate(8px, -50%)"
            className="label whitespace-nowrap text-starlight-dim"
          >
            {e.symbol}
          </ProjectedLabel>
        ))}
      </div>
    </>
  )
}
