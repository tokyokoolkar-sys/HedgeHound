// /den (T34): the paper desk. A working page on the quiet sky: the book's settings (PAPER, saved in this
// browser), what clears that bar right now (LIVE, re-amortised at the book's hold and cost, ι's rule), and a
// year of what-ifs (simulated, never a forecast). ι's glass orb sits beside the desk holding exactly the coins
// that clear; on phones it sits under the header and scrolls with the page. No trades exist in Phase 0, so
// none are shown (owner, T34: the old sample book is deleted).
import { Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { formatNet } from "@/lib/scan/loudest"
import { useScan } from "@/lib/scan/use-scan"
import { CAPITAL, DEFAULT_BOOK, KILL_LOSS, dragPoints, money } from "@/lib/scent"
import { clearsBar, denAnchor } from "@/lib/stage/den"
import { SHAKY_BELOW } from "@/lib/stage/field"
import { useRequestSky } from "@/lib/stage/request-sky"
import { QUIET_SCENE, useStage } from "@/lib/stage/store"
import { useMounted } from "@/lib/use-mounted"
import { HairlineSlider } from "../controls/hairline-slider"
import { SourceTag } from "../edition/source-tag"
import { useScrollFrame } from "../edition/use-scroll-frame"
import { clearBook, saveBook, useBook } from "../objects/use-book"
import { WhatIfs } from "./what-ifs"

const GUTTER = "px-[max(16px,7vw)]"
const ARRIVE_S = 0.8

/** Minutes and seconds to the next whole hour, when Lighter settles funding. Client-only. */
function useNextHour() {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setLeft(Math.ceil(Date.now() / 3_600_000) * 3_600_000 - Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  if (left == null) return "–:––"
  return `${Math.floor(left / 60_000)}:${String(Math.floor((left % 60_000) / 1000)).padStart(2, "0")}`
}

export function DenPage() {
  useRequestSky("den")
  const scan = useScan()
  const { book, saved } = useBook()
  const ready = useMounted() && !scan.loading
  const clearing = ready ? clearsBar(scan.rows, book) : []
  const clock = useNextHour()
  const live = <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />

  // The orb: over the side anchor on wide screens, the in-flow one on phones (whichever is laid out).
  const side = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const flow = useRef<HTMLDivElement>(null)
  // Arrival: from ι the orb glides from its Edition spot into its box (denFocus 0 → 1); from elsewhere it
  // fades in where it belongs.
  const appear = useRef({ from: 0, fromIota: false, t0: 0 })
  useEffect(() => {
    const sc = useStage.getState().scene
    const iota = sc.denOn > 0.5
    appear.current = { from: iota ? sc.denAppear : 0, fromIota: iota, t0: performance.now() }
    return () => void (denAnchor.el = null)
  }, [])
  useScrollFrame((s) => {
    const a = side.current && side.current.offsetWidth > 0 ? side.current : flow.current
    denAnchor.el = a
    const t = s.reduced ? 1 : Math.min(1, (performance.now() - appear.current.t0) / 1000 / ARRIVE_S)
    const e = 1 - Math.pow(1 - t, 3)
    const sc = scroller.current
    const max = sc ? Math.max(1, sc.scrollHeight - sc.clientHeight) : 1
    // Phones: the orb scrolls with the page and fades as its box passes under the nav (the canvas isn't clipped).
    const box = a === flow.current ? a?.getBoundingClientRect() : undefined
    const away = box ? Math.min(1, Math.max(0, (64 + box.height * 0.15 - box.top) / (box.height * 0.55))) : 0
    s.set({
      transition: 0,
      scene: {
        ...QUIET_SCENE,
        denOn: 1,
        denAppear: appear.current.from + (1 - appear.current.from) * e,
        denFocus: appear.current.fromIota ? e : 1,
        // The orb turns with the desk's scroll and stops when it stops.
        denTurn: (sc?.scrollTop ?? 0) / max,
        denLabels: 0,
        denAway: away,
      },
    })
  })

  const set = (patch: Partial<typeof book>) => saveBook({ ...book, ...patch })
  const drag = dragPoints(book.cost, book.hold)

  return (
    // The desk scrolls in its own region under the nav, so text clips crisply at the nav's edge instead of
    // sliding under its words (the nav has no bar).
    <main className="relative z-10 flex h-dvh flex-col overflow-hidden pt-16">
      {/* The orb's box beside the desk (wide screens). */}
      <div ref={side} aria-hidden="true" className="pointer-events-none fixed top-16 right-[max(16px,7vw)] bottom-0 left-[calc(max(16px,7vw)+560px+48px)] hidden lg:block" />

      <div
        ref={scroller}
        data-lenis-prevent
        className={`${GUTTER} min-h-0 flex-1 overflow-y-auto overscroll-contain pb-24 [scrollbar-color:var(--color-starlight-faint)_transparent] [scrollbar-width:thin]`}
      >
        <div className="grid w-full max-w-[560px] gap-14">
          <header className="grid gap-3 pt-6 md:pt-10">
            <p className="label m-0 text-starlight-dim">
              <span className="bayer mr-1">ι</span> · a paper desk for a small research budget
            </p>
            <h1 className="m-0 font-light-display text-title text-starlight">The Den</h1>
            <p className="label m-0 text-starlight-dim">Phase 0 · paper only · no order code · no exchange keys</p>
          </header>

          {/* The orb's box on phones and tablets: under the header, scrolling with the page. */}
          <div ref={flow} aria-hidden="true" className="-my-6 h-[34svh] lg:hidden" />

          <section aria-labelledby="book" className="grid gap-4">
            <div className="grid gap-2">
              <h2 id="book" className="m-0 font-light-display text-subtitle text-starlight">
                Your book
              </h2>
              <p className="label m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-starlight-dim">
                <SourceTag kind="paper" className="text-starlight" />
                <span>{saved ? "your settings, saved in this browser" : "the defaults: nothing saved in this browser yet"}</span>
                {saved && (
                  <button type="button" onClick={clearBook} className="label inline-flex min-h-11 items-center text-starlight hover:text-scan focus-visible:text-scan">
                    back to defaults
                  </button>
                )}
              </p>
            </div>
            <div className="grid">
              <HairlineSlider label="your bar" min={0} max={60} step={1} value={book.minNet} text={`net ≥ ${book.minNet}%`} onChange={(minNet) => set({ minNet })} labelClass="w-28 sm:w-36" valueClass="w-24 text-right" />
              <HairlineSlider label="hold" min={8} max={168} step={8} value={book.hold} text={`${book.hold} h`} onChange={(hold) => set({ hold })} labelClass="w-28 sm:w-36" valueClass="w-24 text-right" />
              <HairlineSlider label="leverage" min={1} max={2} step={0.5} value={book.lev} text={`${book.lev}×`} onChange={(lev) => set({ lev })} labelClass="w-28 sm:w-36" valueClass="w-24 text-right" />
              <HairlineSlider label="round trip" min={0.1} max={0.6} step={0.05} value={book.cost} text={`${book.cost.toFixed(2)}%`} onChange={(cost) => set({ cost })} labelClass="w-28 sm:w-36" valueClass="w-24 text-right" />
            </div>
            <dl className="label m-0 grid gap-x-6 gap-y-1 text-starlight-dim sm:grid-cols-[auto_1fr] sm:gap-y-2 [&_dd]:max-sm:mb-2">
              <dt>budget</dt>
              <dd className="m-0 text-starlight">{money(CAPITAL, 0)} on paper · isolated margin · leverage capped at 2×</dd>
              <dt>drag</dt>
              <dd className="m-0 text-starlight">
                <span className="tabular-nums">{book.cost.toFixed(2)}%</span> over <span className="tabular-nums">{book.hold} h</span> costs{" "}
                <span className="tabular-nums">{drag.toFixed(1)}</span> APR points
              </dd>
              <dt>kill switch</dt>
              <dd className="m-0 text-starlight">stop at a {money(KILL_LOSS, 0)} loss, a quarter of the budget</dd>
              <dt>next Lighter hour</dt>
              <dd className="m-0 text-starlight">
                <span className="tabular-nums">{clock}</span> <span className="text-starlight-dim">· funding settles on the hour, not on every poll</span>
              </dd>
            </dl>
            {(book.minNet !== DEFAULT_BOOK.minNet || book.hold !== DEFAULT_BOOK.hold) && (
              <p className="label m-0 text-starlight-dim">
                <span className="bayer mr-1">ι</span> in the Edition and the orb follow these settings
              </p>
            )}
          </section>

          <section aria-labelledby="clearing" className="grid gap-4">
            <div className="grid gap-2">
              <h2 id="clearing" className="m-0 font-light-display text-subtitle text-starlight">
                Clearing your bar now
              </h2>
              <p className="label m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-starlight-dim">
                <span className="tabular-nums">
                  {ready ? `${clearing.length} ${clearing.length === 1 ? "coin" : "coins"}` : "asking the scanner…"}
                </span>
                {ready && live}
                <span>· the orb holds exactly these</span>
              </p>
            </div>
            {ready && clearing.length > 0 && (
              <ul className="m-0 list-none p-0">
                {clearing.map((r) => (
                  <li key={r.symbol} className="grid grid-cols-[minmax(6.5rem,1fr)_auto] items-baseline gap-x-4 border-b border-starlight-faint/40 py-2">
                    <Link to="/sky" search={{ star: r.symbol }} className="inline-flex min-h-8 items-center font-mono text-sm tracking-wide text-starlight hover:text-scan focus-visible:text-scan">
                      {r.symbol}
                    </Link>
                    <span className="figure text-right tabular-nums text-scent">{formatNet(r.net)}</span>
                    <span className="label col-span-2 text-starlight-dim">
                      <span className="text-scan">↑</span> {r.long} <span className="text-scent">↓</span> {r.short} · held{" "}
                      <span className="tabular-nums">{Math.round(r.persistence * 100)}%</span>
                      {r.persistence < SHAKY_BELOW && <span className="text-starlight"> shaky</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {ready && clearing.length === 0 && <p className="label m-0 text-starlight-dim">Nothing clears this bar. Lower it, or accept a quiet hour.</p>}
            <p className="label m-0 flex flex-wrap items-center gap-x-6 text-starlight-dim">
              <span>net re-counted at your hold and round trip; clean coins only</span>
              <Link
                to="/scanner"
                search={{ status: "ok" }}
                className="inline-flex min-h-11 items-center text-starlight underline decoration-starlight-faint decoration-1 underline-offset-[6px] hover:decoration-starlight focus-visible:text-scan"
              >
                Open scanner →
              </Link>
            </p>
          </section>

          <WhatIfs />
        </div>
      </div>
    </main>
  )
}
