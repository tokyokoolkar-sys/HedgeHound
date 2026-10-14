// /scanner (T31): the operator's table. A working page, so no scroll choreography: a quiet sky, the
// title, filters that live in the URL, and every coin of the last poll as mono rows straight on the sky.
// The column header sits outside the scrolling rows, so rows clip crisply at its hairline instead of
// sliding under it (no band, no fade). Rows open the coin on the sky.
import { Link, useNavigate } from "@tanstack/react-router"
import { Slider } from "radix-ui"
import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/cn"
import { useRequestSky } from "@/lib/stage/request-sky"
import { useMounted } from "@/lib/use-mounted"
import { SHAKY_BELOW } from "@/lib/stage/field"
import { DEFAULT_SCAN_PARAMS, type ScanRow } from "@/lib/scan/types"
import { useScan } from "@/lib/scan/use-scan"
import { MIN_RANGE, OK_SAMPLES, firstDir, formatFlip, nextSort, pct, tableRows, type ScannerSearch, type SortKey, type StatusFilter } from "@/lib/scan/table"
import { SourceTag } from "../edition/source-tag"
import { SKY_ROUTE } from "../nav/coin-search"

const GUTTER = "px-[max(16px,7vw)]"
/**
 * One template for the header and every row, so the columns line up across the two scroll regions. Below 1024px
 * rows are two lines; at 1024 seven columns; gross and liq dist join from 1280 (`wide`).
 */
const COLS =
  "lg:grid lg:grid-cols-[minmax(6.5rem,1.3fr)_minmax(4.5rem,1fr)_minmax(6.5rem,1fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_minmax(11rem,1.5fr)_minmax(5.5rem,1fr)] lg:gap-x-4 xl:grid-cols-[minmax(7rem,1.3fr)_minmax(4.5rem,1fr)_minmax(4.5rem,1fr)_minmax(6.5rem,1fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_minmax(11rem,1.5fr)_minmax(4.5rem,1fr)_minmax(5.5rem,1fr)]"

const COLUMNS: Array<{ key: SortKey | null; label: string; num?: boolean; wide?: boolean; title: string }> = [
  { key: "symbol", label: "coin", title: "Symbol" },
  { key: "net", label: "net", num: true, title: "Net APR after the round-trip cost at the hold" },
  { key: "gross", label: "gross", num: true, wide: true, title: "Gross APR of the funding spread" },
  {
    key: "held",
    label: "held 6 h",
    num: true,
    title: "Share of the last 6 h whose sign and size held",
  },
  {
    key: "n24",
    label: "samples",
    num: true,
    title: `Samples in the trailing 24 h; ${OK_SAMPLES} earn clean`,
  },
  { key: "flip", label: "last flip", num: true, title: "Hours since the spread last changed sign" },
  { key: null, label: "legs", title: "Venue to be long (↑) and short (↓)" },
  {
    key: "liq",
    wide: true,
    label: "liq dist",
    num: true,
    title: `Distance to liquidation at ${DEFAULT_SCAN_PARAMS.lev}× leverage`,
  },
  { key: null, label: "status", title: "Clean coins can alert; building ones are a snapshot only" },
]

const STATUS: Array<{ v: StatusFilter; label: string }> = [
  { v: "all", label: "all" },
  { v: "ok", label: "clean" },
  { v: "building", label: "building" },
]

const PHONE_SORTS: Array<[SortKey, string]> = [
  ["net", "net"],
  ["held", "held"],
  ["n24", "samples"],
  ["flip", "flip"],
]

export function ScannerPage({ search }: { search: ScannerSearch }) {
  useRequestSky("quiet")
  const scan = useScan()
  const navigate = useNavigate()
  const scroller = useRef<HTMLDivElement>(null)
  // The scanner is only ever asked from the browser, so the server renders the "asking" state and the
  // rows arrive after mount (no hydration mismatch).
  const ready = useMounted() && !scan.loading
  const rows = ready ? tableRows(scan.rows, search) : []
  const sort = search.sort ?? "net"
  const dir = search.dir ?? firstDir(sort)
  const tag = <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />

  const update = (patch: Partial<ScannerSearch>) =>
    void navigate({
      to: "/scanner",
      search: (prev: ScannerSearch) => ({ ...prev, ...patch }),
      replace: true,
      resetScroll: false,
    })
  const open = (symbol: string) => void navigate({ to: SKY_ROUTE, search: { star: symbol } })

  // A pointed-out coin scrolls into view inside the table (not the page).
  useEffect(() => {
    if (!search.sym || !ready) return
    const el = scroller.current?.querySelector<HTMLElement>(`[data-sym="${CSS.escape(search.sym)}"]`)
    el?.scrollIntoView({ block: "center" })
  }, [search.sym, ready])

  const skipped = (scan.meta.skipped_zero?.length ?? 0) + (scan.meta.skipped_young?.length ?? 0) + (scan.meta.skipped_thin?.length ?? 0)

  return (
    <main className="relative z-10 flex h-dvh flex-col overflow-hidden pt-16">
      <header className={cn(GUTTER, "shrink-0 pt-3 md:pt-10")}>
        <p className="label m-0 text-starlight-dim max-md:hidden">Lighter × Binance Futures · every coin, every poll</p>
        <h1 className="mt-0 mb-0 md:mt-3 font-light-display text-title text-starlight">The Scanner</h1>
        <p className="label mt-3 mb-0 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-starlight-dim md:mt-4">
          <span>
            net after a {DEFAULT_SCAN_PARAMS.cost.toFixed(2)}% round trip
            <span className="max-md:hidden"> at a {DEFAULT_SCAN_PARAMS.hold} h hold</span>
            <span className="md:hidden">, {DEFAULT_SCAN_PARAMS.hold} h</span>
          </span>
          <SourceTag kind="paper" className="text-starlight" />
        </p>

        {/* Filters: plain text toggles and a hairline slider, all written to the URL. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-0 md:mt-8 md:gap-y-3">
          <div role="group" aria-label="Status" className="flex items-center gap-4">
            {STATUS.map((s) => {
              const on = (search.status ?? "all") === s.v
              return (
                <button
                  key={s.v}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ status: s.v === "all" ? undefined : s.v })}
                  className={cn(
                    "label inline-flex min-h-11 items-center decoration-1 underline-offset-[6px]",
                    on ? "text-starlight underline" : "text-starlight-dim hover:text-starlight",
                  )}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
          <NetFloor value={search.min} onChange={(min) => update({ min })} />
          <p className="label m-0 flex min-h-11 items-center gap-3 whitespace-nowrap text-starlight-dim" aria-live="polite">
            {!ready ? (
              <span>asking the scanner…</span>
            ) : (
              <>
                <span className="tabular-nums">
                  {rows.length} of {scan.rows.length} coins
                </span>
                {tag}
              </>
            )}
          </p>
        </div>

        {/* Phones have no column header, so sorting is a row of words. */}
        <div role="group" aria-label="Sort by" className="flex flex-wrap items-center gap-x-4 lg:hidden">
          <span className="label text-starlight-dim">sort</span>
          {PHONE_SORTS.map(([k, label]) => {
            const on = sort === k
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => update(nextSort(search, k))}
                className={cn("label inline-flex min-h-11 items-center", on ? "text-starlight" : "text-starlight-dim")}
              >
                {label}
                {on && <span aria-hidden="true">&nbsp;{dir === "desc" ? "↓" : "↑"}</span>}
              </button>
            )
          })}
        </div>
      </header>

      <div role="table" aria-label="Every coin in the last poll" aria-rowcount={rows.length + 1} className="mt-4 flex min-h-0 flex-1 flex-col md:mt-8">
        <div role="rowgroup" className={cn(GUTTER, "hidden shrink-0 overflow-y-hidden [scrollbar-gutter:stable] [scrollbar-width:thin] lg:block")}>
          <div role="row" className={cn(COLS, "border-b border-starlight-faint")}>
            {COLUMNS.map((c) => (
              <HeaderCell key={c.label} col={c} sort={sort} dir={dir} onSort={(k) => update(nextSort(search, k))} />
            ))}
          </div>
        </div>
        <div
          ref={scroller}
          role="rowgroup"
          data-lenis-prevent
          className={cn(
            GUTTER,
            "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-color:var(--color-starlight-faint)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]",
          )}
        >
          {rows.map((r) => (
            <Row key={r.symbol} r={r} on={r.symbol === search.sym} onOpen={() => open(r.symbol)} />
          ))}
          {ready && rows.length === 0 && (
            <div role="row" className="py-10">
              <p role="cell" className="label m-0 flex flex-wrap items-baseline gap-4 text-starlight-dim">
                No coin clears these filters.
                <button
                  type="button"
                  onClick={() => update({ status: undefined, min: undefined })}
                  className="label inline-flex min-h-11 items-center text-starlight hover:text-scan"
                >
                  clear filters
                </button>
              </p>
            </div>
          )}
          <footer className="label grid gap-2 border-t border-starlight-faint pt-4 pb-10 text-starlight-dim">
            {ready && skipped > 0 && (
              <p className="m-0">
                <span className="tabular-nums">{skipped}</span> more skipped on purpose (no funding print, too young, too thin) {tag}{" "}
                <Link to="/" hash="chapter-embers" className="inline-flex min-h-11 items-center text-starlight hover:text-scan">
                  <span className="bayer mr-1.5">η</span>Cold Embers →
                </Link>
              </p>
            )}
            <p className="m-0">Phase 0 · paper only · no order code · a row opens the coin on the sky</p>
          </footer>
        </div>
      </div>
    </main>
  )
}

function HeaderCell({ col, sort, dir, onSort }: { col: (typeof COLUMNS)[number]; sort: SortKey; dir: "asc" | "desc"; onSort: (k: SortKey) => void }) {
  const on = col.key != null && col.key === sort
  const ariaSort = on ? (dir === "asc" ? "ascending" : "descending") : undefined
  const align = col.num ? "justify-end text-right" : "justify-start"
  if (!col.key)
    return (
      <div role="columnheader" title={col.title} className={cn("label flex min-h-11 items-center whitespace-nowrap text-starlight-dim", align, col.wide && "hidden xl:flex")}>
        {col.label}
      </div>
    )
  const key = col.key
  return (
    <div role="columnheader" aria-sort={ariaSort} className={cn("flex", align, col.wide && "hidden xl:flex")}>
      <button
        type="button"
        title={col.title}
        onClick={() => onSort(key)}
        className={cn("label inline-flex min-h-11 items-center gap-1 whitespace-nowrap", on ? "text-starlight" : "text-starlight-dim hover:text-starlight")}
      >
        {col.label}
        <span aria-hidden="true" className={cn("w-[1ch]", !on && "invisible")}>
          {dir === "desc" ? "↓" : "↑"}
        </span>
      </button>
    </div>
  )
}

function Row({ r, on, onOpen }: { r: ScanRow; on: boolean; onOpen: () => void }) {
  const ok = r.status === "ok"
  const alert = ok && r.net_apr > 0
  const shaky = r.persistence < SHAKY_BELOW
  const net = <span className={cn("figure tabular-nums", alert ? "text-scent" : "text-starlight")}>{pct(r.net_apr)}</span>
  const legs = (
    <span className="whitespace-nowrap">
      <span className="text-scan">↑</span> {r.long} <span className="text-scent">↓</span> {r.short}
    </span>
  )
  const status = (
    <>
      {ok ? "clean" : "building"}
      {r.stale && <span className="text-starlight"> · stale</span>}
    </>
  )
  return (
    <div
      role="row"
      data-sym={r.symbol}
      onClick={onOpen}
      className={cn(
        COLS,
        "group relative cursor-pointer border-b border-starlight-faint/40 py-2.5 hover:bg-starlight/[0.04] lg:items-baseline lg:py-0.5",
        on && "before:absolute before:inset-y-0 before:-left-3 before:w-px before:bg-scan",
      )}
    >
      {/* Phones: two lines, the coin and its net, then legs · held · status. */}
      <div className="flex items-baseline justify-between gap-4 lg:contents">
        <Cell>
          <span className="inline-flex items-baseline gap-3">
            <Link
              to={SKY_ROUTE}
              search={{ star: r.symbol }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "inline-flex min-h-11 items-center font-mono text-sm tracking-wide lg:min-h-8",
                on ? "text-scan" : "text-starlight group-hover:text-starlight",
              )}
            >
              {r.symbol}
            </Link>
            <span className="label text-starlight-dim lg:hidden">{status}</span>
          </span>
        </Cell>
        <Cell num>{net}</Cell>
      </div>
      <p role="cell" className="label m-0 text-starlight-dim lg:hidden">
        {legs} · held <span className="tabular-nums">{Math.round(r.persistence * 100)}%</span>
        {shaky && <span className="text-starlight"> shaky</span>}
      </p>
      <Cell num at="xl">
        <span className="label tabular-nums text-starlight-dim">{pct(r.gross_apr)}</span>
      </Cell>
      <Cell num at="lg">
        <span className="label tabular-nums text-starlight-dim">
          {shaky && <span className="text-starlight">shaky </span>}
          {Math.round(r.persistence * 100)}%
        </span>
      </Cell>
      <Cell num at="lg">
        <span className={cn("label tabular-nums", r.n24 >= OK_SAMPLES ? "text-starlight" : "text-starlight-dim")}>
          {r.n24}/{OK_SAMPLES}
        </span>
      </Cell>
      <Cell num at="lg">
        <span className="label tabular-nums text-starlight-dim">{formatFlip(r)}</span>
      </Cell>
      <Cell at="lg">
        <span className="label text-starlight-dim">{legs}</span>
      </Cell>
      <Cell num at="xl">
        <span className="label tabular-nums text-starlight-dim">{pct(r.liq_dist)}</span>
      </Cell>
      <Cell at="lg">
        <span className={cn("label", ok ? "text-starlight" : "text-starlight-dim")}>{status}</span>
      </Cell>
    </div>
  )
}

/** `at`: the width from which the cell has its own column (below it, the row's two-line form carries it). */
function Cell({ children, num, at }: { children: ReactNode; num?: boolean; at?: "lg" | "xl" }) {
  return (
    <div role="cell" className={cn("whitespace-nowrap", num && "text-right", at === "lg" && "hidden lg:block", at === "xl" && "hidden xl:block")}>
      {children}
    </div>
  )
}

/** The net floor: a hairline slider; the far left means no floor ("any"). */
function NetFloor({ value, onChange }: { value: number | undefined; onChange: (v: number | undefined) => void }) {
  const v = value ?? MIN_RANGE[0]
  const text = value == null ? "any" : `≥ ${pct(value)}`
  return (
    <div className="flex items-center gap-4">
      <span id="net-floor" className="label text-starlight-dim">
        net
      </span>
      <Slider.Root
        aria-labelledby="net-floor"
        min={MIN_RANGE[0]}
        max={MIN_RANGE[1]}
        step={1}
        value={[v]}
        onValueChange={([n]) => onChange(n <= MIN_RANGE[0] ? undefined : n)}
        className="relative flex h-11 w-40 touch-none items-center select-none"
      >
        <Slider.Track className="relative h-px grow bg-starlight-faint" />
        <Slider.Thumb
          aria-valuetext={text}
          className="block size-3 rounded-full border border-starlight bg-void outline-none focus-visible:border-scan focus-visible:ring-1 focus-visible:ring-scan"
        />
      </Slider.Root>
      <span className="label w-[8ch] tabular-nums text-starlight">{text}</span>
    </div>
  )
}
