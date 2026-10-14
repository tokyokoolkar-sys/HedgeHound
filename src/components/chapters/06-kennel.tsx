// ζ The Kennel (PLAN §3 ζ, TICKETS T23), on the β–ε pattern. Owner decisions: (a) twinkle by
// 1 − persistence as the ambient life, (b) keep the subtitle's claim and check it live, (c) our editorial
// list of twenty meme coins, labelled as ours.
// - copy: <Chapter> (why meme coins pay more and flip faster; why persistence has to earn the alert), then
//   a live second beat: the kennel against everyone else (medians), a verdict on today's data, the
//   kennel coins as rows, one SourceTag, and what the 1000 prefix means;
// - instrument: objects/kennel.tsx, channels in kennel-scene.ts; labels pinned to it.
import { band } from "@/lib/motion/math"
import { useRef, type ReactNode } from "react"
import { cn } from "@/lib/cn"
import { formatNet } from "@/lib/scan/loudest"
import { useScan } from "@/lib/scan/use-scan"
import type { ScanRow } from "@/lib/scan/types"
import { PEN_R, baseSymbol, inKennel, kennelLabels, kennelStats, kennelToWorld, labelSide, placeKennel, verdict, type GroupStats } from "@/lib/stage/kennel"
import { INSTRUMENT_EXTENT } from "@/lib/stage/layout"
import { KENNEL, type ChapterDef } from "@/content/edition"
import { useInstrumentLayout } from "../objects/use-radar"
import { Beat } from "../edition/beat"
import { Chapter } from "../edition/chapter"
import { applyLook } from "../edition/look"
import { ProjectedLabel } from "../edition/projected-label"
import { SourceTag } from "../edition/source-tag"
import { useScrollFrame } from "../edition/use-scroll-frame"

type Props = { def: ChapterDef; exitInto?: string; last?: boolean }

const pct = (x: number | null) => (x == null ? "—" : `${Math.round(x * 100)}%`)
const net = (x: number | null) => (x == null ? "—" : formatNet(x))

function statValue(s: GroupStats): ReactNode {
  return (
    <span className="grid gap-1 pt-0.5">
      <span className="text-body">
        held {pct(s.held)} · net <span className="figure">{net(s.net)}</span>
      </span>
      <span className="label text-starlight-dim">median of {s.n} coins</span>
    </span>
  )
}

function coinValue(r: ScanRow): ReactNode {
  const ok = r.status === "ok"
  return (
    <span className="grid gap-1 pt-0.5">
      <span className="flex items-baseline gap-3">
        {/* Orange means an alert: clean and paying. A clean coin that loses after costs stays starlight. */}
        <span className={cn("figure", ok && r.net_apr > 0 ? "text-scent" : "text-starlight")}>{formatNet(r.net_apr)}</span>
        <span className="label text-starlight-dim">{ok ? "clean" : "building history"}</span>
      </span>
      <span className="label text-starlight-dim">
        held {pct(r.persistence)} · last flip {r.hours_since_flip.toFixed(1)} h ago
      </span>
    </span>
  )
}

export function KennelChapter({ def, exitInto, last }: Props) {
  const scan = useScan()
  const narrow = useInstrumentLayout().mode === "narrow"
  const { kennel, rest } = kennelStats(scan.rows, KENNEL)
  const coins = scan.rows
    .filter((r) => inKennel(r.symbol, KENNEL))
    .sort((a, b) => b.net_apr - a.net_apr)
    .slice(0, narrow ? 2 : 3)
  const prefixed = scan.rows.find((r) => inKennel(r.symbol, KENNEL) && baseSymbol(r.symbol) !== r.symbol)
  const tag = <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
  const rows: Array<[string, ReactNode]> = [
    ["Kennel", statValue(kennel)],
    ["The rest", statValue(rest)],
    ["Verdict", <span key="v">{verdict(kennel, rest)}</span>],
    ...coins.map((r): [string, ReactNode] => [r.symbol, coinValue(r)]),
  ]
  const footer = (
    <span className="grid justify-items-start gap-2">
      {tag}
      {prefixed && (
        <span className="label text-starlight-dim">
          {prefixed.symbol} is {baseSymbol(prefixed.symbol)} counted in thousands, which keeps the contract price readable
        </span>
      )}
    </span>
  )

  return (
    <>
      <Chapter def={def} exitInto={exitInto} last={last} />
      {def.beat && kennel.n > 0 && (
        <Beat
          section={def.id}
          beat={def.beat}
          letter={def.letter ?? ""}
          stacked={def.stacked && { in: def.stacked.beatIn, out: def.stacked.beatOut }}
          rows={rows}
          footer={footer}
        />
      )}
      {/* The measurements as text for screen readers (the beat above is visual only). */}
      {def.beat && kennel.n > 0 && (
        <div className="sr-only">
          <h3>{def.beat.title}</h3>
          <p>
            Kennel median: held {pct(kennel.held)}, net {net(kennel.net)} across {kennel.n} coins. Everyone else: held {pct(rest.held)}, net{" "}
            {net(rest.net)} across {rest.n} coins. {verdict(kennel, rest)}
          </p>
          <p>{scan.live ? "Live reading from the local scanner" : "Sample data, not a live reading"}</p>
        </div>
      )}
      <KennelLabels rows={scan.rows} tag={tag} />
    </>
  )
}

function KennelLabels({ rows, tag }: { rows: ScanRow[]; tag: ReactNode }) {
  const layout = useInstrumentLayout()
  const frame = useRef<HTMLDivElement>(null)
  const coins = useRef<HTMLDivElement>(null)
  const stars = placeKennel(rows, KENNEL)
  const top = kennelLabels(stars, layout.labels)

  useScrollFrame((s) => {
    const sc = s.scene
    // Caption only once the kennel is featured (stacked layouts keep the tucked pen quiet).
    applyLook(frame.current, { opacity: sc.kennelAppear * band(sc.kennelFocus, 0.8, 1) * (1 - band(sc.kennelAway, 0, 0.3)) * sc.kennelOn, y: 0, blur: 0 })
    applyLook(coins.current, { opacity: sc.kennelLabels, y: 0, blur: 0 })
  })

  if (stars.length === 0) return null
  return (
    <>
      <div ref={frame} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2]" style={{ visibility: "hidden" }}>
        <ProjectedLabel point={() => kennelToWorld(-INSTRUMENT_EXTENT, PEN_R * 0.8 + 0.75)} offset="translate(0, -100%)" className="grid gap-1.5 whitespace-nowrap">
          <span className="flex max-w-[min(80vw,340px)] flex-wrap items-baseline gap-x-3 gap-y-1 [&>*]:whitespace-nowrap">
            <span className="label text-starlight-dim">
              <span className="bayer mr-1">ζ</span> {stars.length} coins · our list
            </span>
            {tag}
          </span>
          <span className="label text-starlight-dim">twinkle = shaky last 6 h</span>
        </ProjectedLabel>
      </div>
      <div ref={coins} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2]" style={{ visibility: "hidden" }}>
        {top.map((k) => (
          <ProjectedLabel
            key={k.symbol}
            point={() => kennelToWorld(k.x, k.y)}
            offset={labelSide(k) === "left" ? "translate(calc(-100% - 10px), -50%)" : "translate(10px, -50%)"}
            className="whitespace-nowrap"
          >
            <span className="label text-starlight-dim">{k.symbol}</span>{" "}
            <span className={cn("figure text-xs", k.ok && k.net > 0 ? "text-scent" : "text-starlight")}>{formatNet(k.net)}</span>
          </ProjectedLabel>
        ))}
      </div>
    </>
  )
}
