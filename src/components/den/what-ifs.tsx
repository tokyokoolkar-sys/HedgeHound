// A year of what-ifs (T34): the funding-spread playbook's Monte Carlo (lib/monte.ts, logic unchanged) on
// hairline sliders, with its results as mono figures and two thin-line charts. Everything it shows is
// simulated from the inputs on screen: a what-if, never a forecast, and said so next to the figures.
import { useState } from "react"
import { cn } from "@/lib/cn"
import { runMonte, type MonteIn, type MonteOut } from "@/lib/monte"
import { money } from "@/lib/scent"
import { HairlineSlider } from "../controls/hairline-slider"
import { SourceTag } from "../edition/source-tag"

const PATHS = 4000
const START: MonteIn = { cap: 20, lev: 2, mu: 20, vol: 15, thr: 25, cost: 0.3, fix: 3, liq: 0.1 }

const INPUTS: Array<{ k: keyof MonteIn; label: string; min: number; max: number; step: number; text: (v: number) => string }> = [
  { k: "cap", label: "capital", min: 10, max: 200, step: 5, text: (v) => money(v, 0) },
  { k: "lev", label: "leverage", min: 1, max: 5, step: 0.5, text: (v) => `${v}×` },
  { k: "mu", label: "average net", min: 0, max: 60, step: 1, text: (v) => `${v}%` },
  { k: "vol", label: "jumpiness / day", min: 2, max: 50, step: 1, text: (v) => `${v}` },
  { k: "thr", label: "enter above", min: 5, max: 80, step: 1, text: (v) => `${v}%` },
  { k: "cost", label: "round trip", min: 0.05, max: 0.8, step: 0.05, text: (v) => `${v.toFixed(2)}%` },
  { k: "fix", label: "fixed costs / yr", min: 0, max: 15, step: 0.5, text: (v) => money(v, 1) },
  { k: "liq", label: "scare / day", min: 0, max: 1, step: 0.05, text: (v) => `${v.toFixed(2)}%` },
]

const pc = (p: number) => `${(p * 100).toFixed(1)}%`

export function WhatIfs() {
  const [v, setV] = useState<MonteIn>(START)
  const [out, setOut] = useState<{ res: MonteOut; cap: number } | null>(null)
  const [running, setRunning] = useState(false)

  return (
    <section aria-labelledby="what-ifs" className="grid gap-6">
      <div className="grid gap-2">
        <h2 id="what-ifs" className="m-0 font-light-display text-subtitle text-starlight">
          A year of what-ifs
        </h2>
        <p className="label m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-starlight-dim">
          <span>simulated · a what-if, not a forecast · {PATHS.toLocaleString("en-US")} years from the inputs below</span>
          <SourceTag kind="paper" className="text-starlight" />
        </p>
      </div>

      <div className="grid">
        {INPUTS.map((i) => (
          <HairlineSlider
            key={i.k}
            label={i.label}
            min={i.min}
            max={i.max}
            step={i.step}
            value={v[i.k]}
            text={i.text(v[i.k])}
            onChange={(n) => setV({ ...v, [i.k]: n })}
            labelClass="w-36 sm:w-40"
            valueClass="w-16 text-right"
          />
        ))}
      </div>
      <p className="label m-0 tracking-wide normal-case text-starlight-dim">
        Jumpiness: how far the net spread can swing in a day, in APR points. Scare: the chance, per day in a trade, of a sudden 25% hit.
      </p>
      {v.lev > 2 && <p className="label m-0 text-starlight">above the 2× hard cap: a what-if only, never a setting for the book</p>}

      <div>
        <button
          type="button"
          disabled={running}
          onClick={() => {
            setRunning(true)
            // Let the label change paint before the simulation blocks the thread.
            window.setTimeout(() => {
              setOut({ res: runMonte(v, PATHS), cap: v.cap })
              setRunning(false)
            }, 30)
          }}
          className="label inline-flex min-h-11 items-center text-starlight underline decoration-starlight-faint decoration-1 underline-offset-[6px] hover:decoration-starlight focus-visible:text-scan disabled:text-starlight-dim"
        >
          {running ? "running the years…" : `run ${PATHS.toLocaleString("en-US")} simulated years`}
        </button>
      </div>

      {out && <Results res={out.res} cap={out.cap} />}
    </section>
  )
}

function Results({ res, cap }: { res: MonteOut; cap: number }) {
  const figures: Array<[string, string]> = [
    [`end under ${money(cap, 0)}`, pc(res.pLoss)],
    ["gain 5% or more", pc(res.p5)],
    ["median end", money(res.p50)],
    ["5× or more", pc(res.p5x)],
  ]
  return (
    <div className="grid gap-6" aria-live="polite">
      <dl className="m-0 grid grid-cols-2 gap-x-8 gap-y-4">
        {figures.map(([k, val]) => (
          <div key={k} className="grid gap-1">
            <dt className="label text-starlight-dim">{k}</dt>
            <dd className="figure m-0 tabular-nums text-starlight">{val}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-8">
        <Ended res={res} cap={cap} />
        <Fan res={res} cap={cap} />
      </div>
      <p className="label m-0 text-starlight-dim">
        bad year {money(res.p10)} · median {money(res.p50)} · good year {money(res.p90)} · in a trade {(res.inPos * 100).toFixed(0)}% of days
      </p>
    </div>
  )
}

const W = 300
const H = 110

/** Where the simulated years ended: the outline of the histogram, the losing side in orange, the start marked. */
function Ended({ res, cap }: { res: MonteOut; cap: number }) {
  const n = res.hist.length
  const max = Math.max(1, ...res.hist.map((h) => h.n))
  const x = (i: number) => (i / n) * W
  const y = (c: number) => H - (c / max) * (H - 6)
  const step = (from: number, to: number) => {
    let d = `M ${x(from)} ${H}`
    for (let i = from; i < to; i++) d += ` L ${x(i)} ${y(res.hist[i].n)} L ${x(i + 1)} ${y(res.hist[i].n)}`
    return d + ` L ${x(to)} ${H}`
  }
  const firstWin = res.hist.findIndex((h) => !h.loss)
  const split = firstWin < 0 ? n : firstWin
  return (
    <figure className="m-0 grid gap-2">
      <figcaption className="label text-starlight-dim">where the years ended</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-28 w-full overflow-visible" aria-hidden="true">
        <line x1={0} y1={H} x2={W} y2={H} className="stroke-starlight-faint" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {split > 0 && <path d={step(0, split)} fill="none" className="stroke-scent" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
        {split < n && <path d={step(split, n)} fill="none" className="stroke-starlight" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
        <line x1={x(split)} y1={0} x2={x(split)} y2={H} className="stroke-starlight-faint" strokeWidth={1} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="label m-0 flex justify-between gap-3 whitespace-nowrap text-starlight-dim">
        <span>{res.hist[0]?.label}</span>
        <span>
          <span className="text-scent">loss</span> · start {money(cap, 0)}
        </span>
        <span>{res.hist[n - 1]?.label}</span>
      </p>
    </figure>
  )
}

/** The middle 80% of the years, week by week: the median in starlight, the 10th and 90th percentiles faint. */
function Fan({ res, cap }: { res: MonteOut; cap: number }) {
  const n = res.fan.length
  const hi = Math.max(cap * 1.05, ...res.fan.map((f) => f.hi))
  const lo = Math.min(cap * 0.95, ...res.fan.map((f) => f.lo))
  const x = (i: number) => (i / Math.max(1, n - 1)) * W
  const y = (v: number) => H - ((v - lo) / Math.max(1e-9, hi - lo)) * (H - 4) - 2
  const line = (k: "lo" | "mid" | "hi") => res.fan.map((f, i) => `${i ? "L" : "M"} ${x(i)} ${y(f[k])}`).join(" ")
  return (
    <figure className="m-0 grid gap-2">
      <figcaption className="label text-starlight-dim">the middle 80%, week by week</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-28 w-full overflow-visible" aria-hidden="true">
        <line x1={0} y1={y(cap)} x2={W} y2={y(cap)} className="stroke-starlight-faint" strokeWidth={1} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
        {(["lo", "hi"] as const).map((k) => (
          <path key={k} d={line(k)} fill="none" className="stroke-starlight-faint" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ))}
        <path d={line("mid")} fill="none" className={cn("stroke-starlight")} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="label m-0 flex justify-between gap-3 whitespace-nowrap text-starlight-dim">
        <span>week 1</span>
        <span>dashed · start {money(cap, 0)}</span>
        <span>week {n}</span>
      </p>
      <p className="label m-0 text-starlight-dim">the drop in the last week is the fixed costs, taken at year end</p>
    </figure>
  )
}
