import { cn } from "@/lib/cn"

/**
 * Where a figure came from. Required next to every on-screen number
 * (PRODUCT.md data honesty, PLAN §4.3).
 *
 * - live:   fetched from the local scanner (`/api/scan`)
 * - paper:  the local paper book (browser storage)
 * - sample: static layout sample, synthesized, or the scanner-offline fallback
 *
 * Early slice of T13. Colours are neutral until T10 maps tokens; the scent/scan
 * accents are reserved for meaning (PLAN §2.2), so they are not used here.
 */
export type SourceKind = "live" | "paper" | "sample"

const LABEL: Record<SourceKind, string> = {
  live: "LIVE",
  paper: "PAPER",
  sample: "SAMPLE",
}

const MARK: Record<SourceKind, string> = {
  live: "●",
  paper: "◆",
  sample: "○",
}

type Props = {
  kind: SourceKind
  /** Epoch milliseconds of the reading (the scanner reports seconds; convert in the data layer). */
  ts?: number
  /** LIVE reading older than one scanner poll plus slack (360 s). The data layer decides; the tag only shows it. */
  stale?: boolean
  className?: string
}

function clock(ts: number) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function SourceTag({ kind, ts, stale = false, className }: Props) {
  const time = kind === "live" && ts != null ? clock(ts) : null
  const isStale = kind === "live" && stale
  const title =
    kind === "live"
      ? isStale
        ? "Live reading, but older than one scanner poll"
        : "Live reading from the local scanner"
      : kind === "paper"
        ? "From your local paper book"
        : "Sample data, not a live reading"

  return (
    <span
      title={title}
      className={cn(
        // T10 critique: 11px minimum, LIVE at full strength, SAMPLE/PAPER a step quieter. Colour is
        // inherited so the tag works on the sky and on the legacy pages' cream sections alike.
        "inline-flex items-center gap-1 rounded-full border border-current/30 px-2 py-0.5",
        "font-mono text-[11px] leading-none tracking-[0.14em] uppercase tabular-nums whitespace-nowrap",
        kind === "live" ? "opacity-100" : "opacity-75",
        isStale && "border-dashed",
        className,
      )}
    >
      <span aria-hidden="true">{isStale ? "◌" : MARK[kind]}</span>
      {LABEL[kind]}
      {/* Local time differs between server and browser; the client value wins. */}
      {time && <span suppressHydrationWarning>· {time}</span>}
      {isStale && <span>· STALE</span>}
    </span>
  )
}
