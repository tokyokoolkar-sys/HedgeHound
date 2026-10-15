// /sky (T33): θ's atlas made explorable on the one canvas. Every coin of the last poll at the same spot as in
// θ; the recap rings and letters stay; the loudest are labelled; hover names a star, a click (or ?star=)
// takes it into focus and its reading grows out of a leader line, as in β. A working page: the only motion is
// the focus itself and the arrival from θ, both short eased tweens (instant under reduced motion).
// Focus "flies" (owner pick, T33): the camera travels into the field, every coin at its own depth.
import { Link, useNavigate } from "@tanstack/react-router"
import { Dialog } from "radix-ui"
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import { cn } from "@/lib/cn"
import { band } from "@/lib/motion/math"
import { formatNet } from "@/lib/scan/loudest"
import { OK_SAMPLES, formatFlip, pct } from "@/lib/scan/table"
import { DEFAULT_SCAN_PARAMS, type ScanRow } from "@/lib/scan/types"
import { useScan } from "@/lib/scan/use-scan"
import { atlasScreen, atlasWorld, depthOf, placeAtlas, type AtlasStar } from "@/lib/stage/atlas"
import { SHAKY_BELOW } from "@/lib/stage/field"
import { useRequestSky } from "@/lib/stage/request-sky"
import { QUIET_SCENE, useStage } from "@/lib/stage/store"
import { useMounted } from "@/lib/use-mounted"
import { applyLook } from "../edition/look"
import { ProjectedLabel } from "../edition/projected-label"
import { SourceTag } from "../edition/source-tag"
import { Stardust } from "../edition/stardust"
import { useScrollFrame } from "../edition/use-scroll-frame"
import { recapFor } from "./recap"
import { RecapLabels } from "./recap-labels"

type Vals = { f: number; x: number; y: number; z: number; appear: number; pull: number; dim: number; labels: number; inset: number }
/** `dip`: how far focus eases back mid-way when it moves from one coin to another (the reading steps out, then in). */
type Tween = { from: Vals; to: Vals; t0: number; dur: number; dip: number }

/** The sky behind /sky: the field at full pull, the background stars at 60% so the coins read. */
const SKY_DIM = 0.6
const ARRIVE_S = 0.9
const FOCUS_S = 0.9
const LEADER_PX = 72

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a: Vals, b: Vals, e: number): Vals => {
  const o = { ...a }
  for (const k of Object.keys(a) as Array<keyof Vals>) o[k] = a[k] + (b[k] - a[k]) * e
  return o
}

/** The list column's share of the width (it shows from 1024 px): its right edge plus a gutter. */
function listInset() {
  if (innerWidth < 1024) return 0
  return (Math.max(16, innerWidth * 0.07) + 240 + 48) / innerWidth
}

/** Wide screens put the reading beside the focused coin; phones and portrait tablets dock it at the bottom. */
function useDocked() {
  const [docked, setDocked] = useState(false)
  useEffect(() => {
    const on = () => setDocked(!(innerWidth >= 1024 || (innerWidth >= 768 && innerWidth > innerHeight)))
    on()
    addEventListener("resize", on)
    return () => removeEventListener("resize", on)
  }, [])
  return docked
}

export function SkyPage({ star }: { star?: string }) {
  useRequestSky("sky")
  const scan = useScan()
  const ready = useMounted() && !scan.loading
  const navigate = useNavigate()
  const docked = useDocked()
  const rows = useMemo(() => (ready ? scan.rows : []), [ready, scan.rows])
  const stars = useMemo(() => placeAtlas(rows), [rows])
  const focused = rows.find((r) => r.symbol === star)
  const [hover, setHover] = useState<string | null>(null)
  const tag = <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />

  const focus = (symbol: string | undefined) =>
    void navigate({ to: "/sky", search: { star: symbol }, replace: true })

  // ── The tween: arrival (from θ's field, or from nothing) and focus, written to the scene every tick. ──
  const tween = useRef<Tween | null>(null)
  const cur = useRef<Vals | null>(null)
  const flightBase = useRef(0)
  const go = useCallback((patch: Partial<Vals>, dur: number) => {
    const from = cur.current
    if (!from) return
    const to = { ...(tween.current?.to ?? from), ...patch }
    const reduced = useStage.getState().reduced
    const moving = from.f > 0.5 && to.f > 0.5 && (to.x !== from.x || to.y !== from.y)
    tween.current = { from: { ...from }, to, t0: performance.now(), dur: reduced ? 0 : moving ? dur * 1.5 : dur, dip: moving && !reduced ? 0.55 : 0 }
  }, [])
  useEffect(() => {
    // Start from whatever the sky shows now: θ's atlas carries straight on; from elsewhere the field fades in.
    const sc = useStage.getState().scene
    const fromAtlas = sc.atlasOn > 0.5
    flightBase.current = sc.flight
    cur.current = {
      f: 0,
      x: 0,
      y: 0,
      z: 0,
      appear: fromAtlas ? sc.atlasAppear : 0,
      pull: fromAtlas ? sc.atlasPull : 1,
      dim: sc.skyDim,
      labels: fromAtlas ? sc.atlasLabels : 0,
      inset: fromAtlas ? sc.atlasInset : listInset(),
    }
    go({ appear: 1, pull: 1, dim: SKY_DIM, labels: 1, inset: listInset() }, ARRIVE_S)
    // The column comes and goes with the width (it shows from 1024 px).
    const onResize = () => go({ inset: listInset() }, 0)
    addEventListener("resize", onResize)
    return () => removeEventListener("resize", onResize)
  }, [go])
  const target = focused && stars.find((k) => k.symbol === focused.symbol)
  const [tSym, tx, ty] = target ? [target.symbol, target.x, target.y] : [null, 0, 0]
  useEffect(() => {
    if (tSym) go({ f: 1, x: tx, y: ty, z: depthOf(tSym) }, FOCUS_S)
    else go({ f: 0 }, FOCUS_S * 0.8)
  }, [tSym, tx, ty, go])

  const labelsLayer = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLSpanElement>(null)
  const leader = useRef<HTMLSpanElement>(null)
  const dock = useRef<HTMLDivElement>(null)
  useScrollFrame((s) => {
    const tw = tween.current
    const c = cur.current
    if (!tw || !c) return
    const t = tw.dur <= 0 ? 1 : Math.min(1, (performance.now() - tw.t0) / 1000 / tw.dur)
    const v = (cur.current = lerp(tw.from, tw.to, ease(t)))
    v.f -= tw.dip * Math.sin(Math.PI * t)
    s.set({
      transition: 0,
      scene: {
        ...QUIET_SCENE,
        atlasOn: 1,
        atlasAppear: v.appear,
        atlasPull: v.pull,
        atlasLabels: v.labels,
        atlasAway: 0,
        atlasFocus: v.f,
        atlasFx: v.x,
        atlasFy: v.y,
        atlasFz: v.z,
        atlasDepth: 1,
        atlasFly: 1,
        atlasInset: v.inset,
        skyDim: v.dim,
        // Fly: the background stars stream past too, so the travel reads as depth.
        flight: flightBase.current + v.f * 8,
      },
    })
    // Labels step back while a coin is in focus; the ring closes, the leader draws, then the reading gathers.
    applyLook(labelsLayer.current, { opacity: v.labels * (1 - band(v.f, 0, 0.4)), y: 0, blur: 0 })
    if (ring.current) {
      const r = band(v.f, 0.2, 0.7)
      ring.current.style.opacity = String(r)
      ring.current.style.transform = `translate(-50%, -50%) scale(${(2.2 - 1.2 * r).toFixed(3)})`
    }
    if (leader.current) leader.current.style.transform = `scaleX(${band(v.f, 0.45, 0.75).toFixed(3)})`
    applyLook(dock.current, { opacity: band(v.f, 0.6, 1), y: (1 - band(v.f, 0.6, 1)) * 16, blur: 0 })
  })

  // ── Picking: the nearest star under the pointer, from the atlas's published screen points. ──
  const pick = (e: ReactPointerEvent) => {
    const reach = e.pointerType === "touch" ? 36 : 24
    let best: string | null = null
    let d2 = reach * reach
    atlasScreen.forEach(([x, y], sym) => {
      const d = (x - e.clientX) ** 2 + (y - e.clientY) ** 2
      if (d < d2) {
        d2 = d
        best = sym
      }
    })
    return best as string | null
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && star && focus(undefined)
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  })

  const lit = new Set(recapFor(rows).map((r) => r.symbol))
  // The loudest coins get a name, but never one that would run into a recap label or another name
  // (P4 critique: on phones SUI read as part of ARB's recap). Distances in rough screen px.
  const vw = typeof window === "undefined" ? 1440 : window.innerWidth
  const vh = typeof window === "undefined" ? 900 : window.innerHeight
  const near = (a: AtlasStar, b: AtlasStar) => Math.abs(a.x - b.x) * (vw / 2) < 130 && Math.abs(a.y - b.y) * (vh / 2) < 44
  const taken = stars.filter((k) => lit.has(k.symbol))
  const loud: AtlasStar[] = []
  for (const k of [...stars].filter((k) => k.net > 0 && !lit.has(k.symbol)).sort((a, b) => b.net - a.net)) {
    if (loud.length >= (docked ? 3 : 5)) break
    if (taken.some((t) => near(t, k)) || loud.some((t) => near(t, k))) continue
    loud.push(k)
  }
  const hovered = hover && hover !== star ? stars.find((k) => k.symbol === hover) : undefined
  // Coins already named on the field get only the ring on hover, never a second label.
  const named = !!hovered && (lit.has(hovered.symbol) || loud.some((k) => k.symbol === hovered.symbol))

  return (
    <main
      className="relative z-10 h-dvh overflow-hidden"
      onPointerMove={(e) => {
        const h = pick(e)
        if (h !== hover) setHover(h)
      }}
      onPointerLeave={() => setHover(null)}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return
        const h = pick(e as unknown as ReactPointerEvent)
        if (h) focus(h)
        else if (star) focus(undefined)
      }}
      style={{ cursor: hover ? "pointer" : undefined }}
    >
      <h1 className="sr-only">The Sky: every coin, charted</h1>

      {/* Labels on the field: recap rings and letters, the loudest few, and whatever the pointer is on. */}
      <div ref={labelsLayer} aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ visibility: "hidden" }}>
        <RecapLabels rows={rows} stars={stars} hide={star} />
        {loud.map((k) => (
          <StarLabel key={k.symbol} k={k} />
        ))}
      </div>
      {hovered && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0">
          <ProjectedLabel point={() => atlasWorld.get(hovered.symbol) ?? null} offset="translate(-50%, -50%)">
            <span className="block size-4 rounded-full border border-starlight" />
          </ProjectedLabel>
          {!named && <StarLabel k={hovered} bright />}
        </div>
      )}

      {/* The list: every coin by name, for keyboards and for finding one. A column on wide screens, a sheet on phones. */}
      <aside
        className="sky-arrive fixed top-16 bottom-6 left-[max(16px,7vw)] hidden w-60 flex-col lg:flex"
        aria-label="Every coin"
        onPointerMove={(e) => e.stopPropagation()}
      >
        <SkyHead count={stars.length} tag={tag} />
        <div data-lenis-prevent className="mt-5 min-h-0 flex-1 overflow-y-auto pr-3 [scrollbar-color:var(--color-starlight-faint)_transparent] [scrollbar-width:thin]">
          <CoinList rows={rows} on={star} onHover={setHover} onPick={focus} />
        </div>
      </aside>
      <div className="sky-arrive fixed top-16 inset-x-0 flex items-start justify-between gap-4 px-[max(16px,7vw)] pt-2 lg:hidden">
        <SkyHead count={stars.length} tag={tag} />
        <PhoneList rows={rows} on={star} onPick={focus} />
      </div>

      {/* The focused coin: a cyan ring closes on it, then the reading. */}
      {focused && target && (
        <>
          <ProjectedLabel point={() => atlasWorld.get(focused.symbol) ?? null} className="pointer-events-none">
            <span ref={ring} className="absolute block size-7 rounded-full border border-scan" style={{ opacity: 0 }} />
          </ProjectedLabel>
          {!docked && (
            <ProjectedLabel point={() => atlasWorld.get(focused.symbol) ?? null} offset="translate(18px, -50%)" className="flex items-center">
              <span ref={leader} className="block h-px origin-left bg-starlight-faint" style={{ width: LEADER_PX, transform: "scaleX(0)" }} />
              <Stardust progress={(s) => band(s.scene.atlasFocus, 0.6, 1)} className="pl-4">
                <Reading r={focused} tag={tag} onBack={() => focus(undefined)} />
              </Stardust>
            </ProjectedLabel>
          )}
        </>
      )}
      {docked && focused && (
        <div ref={dock} className="fixed inset-x-0 bottom-0 px-[max(16px,7vw)] pb-6" style={{ visibility: "hidden" }}>
          <Reading r={focused} tag={tag} onBack={() => focus(undefined)} />
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {focused ? `${focused.symbol}: ${formatNet(focused.net_apr)} net APR after costs, ${focused.status === "ok" ? "clean" : "building history"}` : ""}
      </p>

    </main>
  )
}

function SkyHead({ count, tag }: { count: number; tag: ReactNode }) {
  return (
    <div className="grid gap-2">
      <p className="label m-0 text-starlight-dim">
        <span className="bayer mr-1">θ</span> · The Sky
      </p>
      <p className="label m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-starlight-dim">
        <span className="tabular-nums">{count} coins charted</span>
        {tag}
      </p>
      <p className="label m-0 text-starlight-dim max-lg:hidden">a star or a name brings it close · esc pulls back</p>
    </div>
  )
}

/** A star's name on the field: symbol and net, pointing toward the middle so it never leaves the screen. */
function StarLabel({ k, bright }: { k: AtlasStar; bright?: boolean }) {
  return (
    <ProjectedLabel
      point={() => atlasWorld.get(k.symbol) ?? null}
      offset={k.x > 0 ? "translate(calc(-100% - 12px), -50%)" : "translate(12px, -50%)"}
      className="whitespace-nowrap"
    >
      <span className={cn("label", bright ? "text-starlight" : "text-starlight-dim")}>{k.symbol}</span>{" "}
      <span className={cn("figure text-xs", k.ok && k.net > 0 ? "text-scent" : "text-starlight")}>{formatNet(k.net)}</span>
    </ProjectedLabel>
  )
}

function Reading({ r, tag, onBack }: { r: ScanRow; tag: ReactNode; onBack: () => void }) {
  const ok = r.status === "ok"
  const shaky = r.persistence < SHAKY_BELOW
  const rows: Array<[string, ReactNode]> = [
    ["gross", pct(r.gross_apr)],
    [
      "held 6 h",
      <>
        {Math.round(r.persistence * 100)}%{shaky && <span className="text-starlight"> shaky</span>}
      </>,
    ],
    ["samples", `${r.n24}/${OK_SAMPLES}`],
    ["last flip", formatFlip(r)],
    [
      "legs",
      <span className="whitespace-nowrap">
        <span className="text-scan">↑</span> {r.long} <span className="text-scent">↓</span> {r.short}
      </span>,
    ],
    // Liquidation distance comes from the leverage, not the coin (P4 critique), so it says which.
    [`liq dist at ${DEFAULT_SCAN_PARAMS.lev}×`, pct(r.liq_dist)],
  ]
  return (
    <div className="pointer-events-auto w-max max-w-[min(26rem,calc(100vw-32px))]">
      <p className="label m-0 text-starlight-dim">
        {ok ? (r.net_apr > 0 ? "clean · paying" : "clean · below zero") : "building history"}
        {r.stale && " · stale"}
      </p>
      <p className="m-0 mt-1 font-light-display text-title text-starlight">{r.symbol}</p>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
        <span className={cn("figure tabular-nums", ok && r.net_apr > 0 ? "text-scent" : "text-starlight")}>{formatNet(r.net_apr)} net APR</span>
        {tag}
      </div>
      <dl className="label m-0 mt-4 grid grid-cols-[auto_auto] gap-x-6 gap-y-1.5 text-starlight-dim">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="whitespace-nowrap">{k}</dt>
            <dd className="m-0 tabular-nums text-starlight">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="label m-0 mt-3 flex flex-wrap items-center gap-x-6">
        <Link to="/scanner" search={{ sym: r.symbol }} className="inline-flex min-h-11 items-center text-starlight underline decoration-starlight-faint decoration-1 underline-offset-[6px] hover:decoration-starlight focus-visible:text-scan">
          Open in scanner →
        </Link>
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center text-starlight-dim hover:text-starlight focus-visible:text-scan">
          pull back<span className="pointer-coarse:hidden"> · esc</span>
        </button>
      </p>
    </div>
  )
}

const GROUPS: Array<{ label: string; keep: (r: ScanRow) => boolean }> = [
  { label: "clean and paying", keep: (r) => r.status === "ok" && r.net_apr > 0 },
  { label: "building history", keep: (r) => r.status !== "ok" && r.net_apr > 0 },
  { label: "below zero", keep: (r) => r.net_apr <= 0 },
]

function CoinList({ rows, on, onHover, onPick }: { rows: ScanRow[]; on?: string; onHover?: (s: string | null) => void; onPick: (s: string) => void }) {
  return (
    <div className="grid gap-5">
      {GROUPS.map((g) => {
        const list = rows.filter(g.keep).sort((a, b) => b.net_apr - a.net_apr)
        if (list.length === 0) return null
        return (
          <section key={g.label} aria-label={g.label}>
            <h2 className="label m-0 mb-1 flex justify-between text-starlight-dim">
              <span>{g.label}</span>
              <span className="tabular-nums">{list.length}</span>
            </h2>
            <ul className="m-0 list-none p-0">
              {list.map((r) => (
                <li key={r.symbol}>
                  <button
                    type="button"
                    aria-current={r.symbol === on ? "true" : undefined}
                    onClick={() => onPick(r.symbol)}
                    onPointerEnter={() => onHover?.(r.symbol)}
                    onPointerLeave={() => onHover?.(null)}
                    onFocus={() => onHover?.(r.symbol)}
                    onBlur={() => onHover?.(null)}
                    className="grid min-h-8 w-full grid-cols-[1fr_auto] items-baseline gap-3 border-b border-starlight-faint/40 text-left hover:text-starlight max-lg:min-h-11"
                  >
                    <span className={cn("font-mono text-sm tracking-wide", r.symbol === on ? "text-scan" : "text-starlight")}>{r.symbol}</span>
                    <span className={cn("label tabular-nums", r.status === "ok" && r.net_apr > 0 ? "text-scent" : "text-starlight-dim")}>
                      {formatNet(r.net_apr)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function PhoneList({ rows, on, onPick }: { rows: ScanRow[]; on?: string; onPick: (s: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="label inline-flex min-h-11 items-center text-starlight">list</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content aria-describedby={undefined} className="fixed inset-0 z-50 overflow-y-auto bg-void px-[max(16px,7vw)] pb-10 outline-none" data-lenis-prevent>
          <div className="flex h-16 items-center justify-between">
            <Dialog.Title className="label m-0 text-starlight">
              <span className="bayer mr-1">θ</span> · every coin
            </Dialog.Title>
            <Dialog.Close className="label inline-flex min-h-11 items-center text-starlight">close</Dialog.Close>
          </div>
          <CoinList
            rows={rows}
            on={on}
            onPick={(s) => {
              setOpen(false)
              onPick(s)
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
