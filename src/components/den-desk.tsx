import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { SourceTag } from "@/components/edition/source-tag";
import { palette } from "@/lib/palette";
import { runMonte, type MonteIn, type MonteOut } from "@/lib/monte";
import {
  allRows,
  boardRows,
  CAPITAL,
  CLOSED,
  closedStats,
  DEFAULT_BOOK,
  dragPoints,
  ENTRY_COST_PCT,
  KILL_LOSS,
  LINKS,
  money,
  OPEN_SEED,
  openFunding,
  readBook,
  readWatch,
  REBALANCE,
  writeBook,
  type BookSettings,
  type Row,
} from "@/lib/scent";
import { btn, btnGhost } from "@/lib/ui";
import { cn } from "@/lib/cn";

const PHASES = [
  { n: "0", name: "Sniff", line: "Scanner, alerts, paper. You are here.", on: true },
  { n: "1", name: "Twenty", line: "$20 live, one symbol, 2×, placed by hand.", on: false },
  { n: "2", name: "The pack", line: "$50 to $100, two or three symbols.", on: false },
  { n: "3", name: "The leash", line: "API orders. Only after a human says so.", on: false },
];

const MONTE_START: MonteIn = {
  cap: 20,
  lev: 2,
  mu: 20,
  vol: 15,
  thr: 25,
  cost: 0.3,
  fix: 3,
  liq: 0.1,
};

const tip = {
  contentStyle: {
    background: palette.surface,
    border: `1px solid ${palette.line}`,
    borderRadius: 12,
    color: palette.fg,
    fontSize: 12,
  },
  labelStyle: { color: palette.v1Muted },
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block text-sm text-v1-muted">
      <span className="flex items-baseline justify-between gap-3">
        <span>{label}</span>
        <span className="font-sans font-extrabold text-fg">{display}</span>
      </span>
      <input
        className="mt-2 h-11 w-full accent-brand"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function MiniSky({ rows }: { rows: Row[] }) {
  const xs = rows.map((r) => r.pos[0]);
  const ys = rows.map((r) => r.pos[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const X = (x: number) => ((x - minX) / (maxX - minX || 1)) * 100;
  const Y = (y: number) => ((maxY - y) / (maxY - minY || 1)) * 100;
  const by = new Map(rows.map((r) => [r.symbol, r]));
  return (
    <div className="relative h-52">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        {LINKS.map(([a, b]) => {
          const A = by.get(a);
          const B = by.get(b);
          if (!A || !B) return null;
          return (
            <line
              key={`${a}-${b}`}
              x1={X(A.pos[0])}
              y1={Y(A.pos[1])}
              x2={X(B.pos[0])}
              y2={Y(B.pos[1])}
              stroke={palette.line}
              strokeWidth="0.6"
            />
          );
        })}
      </svg>
      {rows.map((r) => (
        <Link
          key={r.symbol}
          to="/universe"
          search={{ star: r.symbol }}
          aria-label={`${r.symbol}${r.alert ? ", scent" : ""}`}
          className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          style={{ left: `${X(r.pos[0])}%`, top: `${Y(r.pos[1])}%` }}
        >
          <span className={cn("block size-2 rounded-full", r.alert ? "bg-brand" : r.status === "filtered" ? "bg-faint" : "bg-ember")} />
        </Link>
      ))}
    </div>
  );
}

function exportCsv(openNets: { symbol: string; net: number; funding: number }[]) {
  const lines = ["symbol,book,hours,long,short,funding,price,variable,net,exit"];
  OPEN_SEED.forEach((t, i) => {
    const snap = openNets[i];
    lines.push(
      [t.symbol, "open", t.settledHours, t.long, t.short, snap?.funding.toFixed(4), t.pricePnl, (t.notional * ENTRY_COST_PCT).toFixed(4), snap?.net.toFixed(4), ""].join(","),
    );
  });
  CLOSED.forEach((t) => {
    const net = t.funding + t.pricePnl - t.variable;
    lines.push([t.symbol, "closed", t.hours, t.long, t.short, t.funding, t.pricePnl, t.variable, net.toFixed(4), `"${t.exit}"`].join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hedgehound-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function DenDesk() {
  const [book, setBook] = useState<BookSettings>(DEFAULT_BOOK);
  const [watch, setWatch] = useState<string[]>([]);
  const [now, setNow] = useState<number | null>(null);
  const [monteIn, setMonteIn] = useState<MonteIn>(MONTE_START);
  const [monte, setMonte] = useState<MonteOut | null>(null);
  const [running, setRunning] = useState(false);
  const stats = useMemo(() => closedStats(), []);

  useEffect(() => {
    setBook(readBook());
    setWatch(readWatch());
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const rows = useMemo(() => boardRows(book), [book]);
  const sky = useMemo(() => allRows(book), [book]);
  const alerts = sky.filter((r) => r.alert).sort((a, b) => b.netApr - a.netApr);
  const featured = alerts[0];
  const trap = sky.find((r) => r.symbol === "1000PEPE");
  const drag = dragPoints(book.cost, book.hold);
  const watchedRows = sky.filter((r) => watch.includes(r.symbol));

  const opens = OPEN_SEED.map((t) => {
    const funding = openFunding(t.spreadHr, t.notional, t.settledHours);
    const entryCost = t.notional * ENTRY_COST_PCT;
    return { ...t, funding, entryCost, net: funding + t.pricePnl - entryCost };
  });

  function setAndSave(next: BookSettings) {
    setBook(next);
    writeBook(next);
  }

  let clock = "—:—";
  if (now != null) {
    const left = Math.ceil(now / 3_600_000) * 3_600_000 - now;
    const m = Math.floor(left / 60_000);
    const s = Math.floor((left % 60_000) / 1000);
    clock = `${m}:${s.toString().padStart(2, "0")}`;
  }

  const used = Math.max(0, -stats.afterFixed);
  const killPct = Math.min(100, (used / KILL_LOSS) * 100);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-24 pb-20">
      <p className="text-sm font-bold text-ember">Phase 0 · the den</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-sans text-huge font-extrabold">
          What the hound
          <span className="block text-brand">is sniffing at</span>
        </h1>
        <p className="max-w-sm font-serif text-xl italic text-ember">
          A paper desk for a {money(CAPITAL, 0)} research budget. The numbers follow the scanner. They are not a live poll.{" "}
          <SourceTag kind="sample" className="align-middle text-v1-muted" />
        </p>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <article className="rounded-card border border-line bg-surface/80 p-4 backdrop-blur-md">
          <p className="text-sm text-v1-muted">Next Lighter hour</p>
          <p className="mt-1 font-sans text-4xl font-extrabold tabular-nums">{clock}</p>
          <p className="mt-2 text-sm text-v1-muted">Funding settles on the hour, not on every 5-minute poll.</p>
        </article>
        <article className="rounded-card border border-line bg-surface/80 p-4 backdrop-blur-md">
          <p className="flex flex-wrap items-center gap-2 text-sm text-v1-muted">
            Room before the kill switch <SourceTag kind="sample" />
          </p>
          <p className="mt-1 font-sans text-4xl font-extrabold">{money(KILL_LOSS - used)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
            <div className="h-full bg-brand" style={{ width: `${killPct}%` }} />
          </div>
          <p className="mt-2 text-sm text-v1-muted">
            Stop at a {money(KILL_LOSS, 0)} loss. Transfers have already used {money(used)} of that room.
          </p>
        </article>
        <article className="rounded-card border border-line bg-surface/80 p-4 backdrop-blur-md">
          <p className="flex flex-wrap items-center gap-2 text-sm text-v1-muted">
            Scents at this bar <SourceTag kind="sample" />
          </p>
          <p className="mt-1 font-sans text-4xl font-extrabold text-brand">{alerts.length}</p>
          <p className="mt-2 text-sm text-v1-muted">
            Net at least {book.minNet}%, persistence at least half, status ok. Drag right now is {drag.toFixed(1)} APR points.
          </p>
        </article>
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {PHASES.map((p) => (
          <li key={p.n} className={cn("rounded-card border p-4", p.on ? "border-brand bg-brand/10" : "border-line bg-bg/40")}>
            <p className={cn("font-sans text-sm font-extrabold", p.on ? "text-brand" : "text-faint")}>Phase {p.n}</p>
            <p className="mt-1 font-sans text-lg font-extrabold">{p.name}</p>
            <p className="mt-1 text-sm text-v1-muted">{p.line}</p>
          </li>
        ))}
      </ol>

      {featured ? (
        <article className="mt-6 rounded-card border border-brand/50 bg-surface/80 p-5 backdrop-blur-md md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ember">
                Loudest clean scent <SourceTag kind="sample" />
              </p>
              <h2 className="mt-1 font-sans text-huge font-extrabold">{featured.symbol}</h2>
              <p className="mt-2 max-w-xl font-serif text-2xl italic text-ember">
                Long {featured.long}, short {featured.short}.
              </p>
            </div>
            <p className="font-sans text-5xl font-extrabold text-brand md:text-6xl">{featured.netApr.toFixed(1)}%</p>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-v1-muted">{featured.note}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/universe" search={{ star: featured.symbol }} className={btn}>
              Zoom {featured.symbol} in the sky
            </Link>
            <Link to="/universe" className={btnGhost}>
              Wander
            </Link>
          </div>
        </article>
      ) : (
        <p className="mt-6 rounded-card border border-line bg-surface/80 p-5 text-v1-muted">
          Nothing clears this bar. Lower the net, or accept a quiet hour.
        </p>
      )}

      {trap && !trap.alert ? (
        <p className="mt-3 rounded-card border border-clay/40 bg-bg/50 p-4 text-sm leading-relaxed text-clay">
          {trap.symbol} prints {trap.grossApr.toFixed(1)}% gross and still is not a scent. Persistence is{" "}
          {Math.round(trap.persistence * 100)}%. A spike is how the scanner used to lie.{" "}
          <SourceTag kind="sample" />
        </p>
      ) : null}

      <section className="mt-8 grid gap-4 lg:grid-cols-5">
        <div className="rounded-card border border-line bg-surface/70 p-4 lg:col-span-3">
          <h2 className="flex flex-wrap items-center gap-3 font-sans text-2xl font-extrabold">
            The board <SourceTag kind="sample" />
          </h2>
          <p className="mt-1 text-sm text-v1-muted">
            Same cuts as the local scanner. Ok rows under the net bar step out. Names still building a day of tape stay, snapshot only.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Slider label="Min net APR" min={0} max={60} step={1} value={book.minNet} display={`${book.minNet}%`} onChange={(minNet) => setAndSave({ ...book, minNet })} />
            <Slider label="Hold" min={8} max={168} step={8} value={book.hold} display={`${book.hold}h`} onChange={(hold) => setAndSave({ ...book, hold })} />
            <Slider label="Leverage, hard cap 2×" min={1} max={2} step={0.5} value={book.lev} display={`${book.lev}×`} onChange={(lev) => setAndSave({ ...book, lev })} />
            <Slider label="Round trip" min={0.1} max={0.6} step={0.05} value={book.cost} display={`${book.cost.toFixed(2)}%`} onChange={(cost) => setAndSave({ ...book, cost })} />
          </div>
          <p className="mt-3 font-serif text-lg italic text-ember">
            net = |hourly gap| × 8760 × 100 − ({book.cost.toFixed(2)} / {book.hold}) × 8760
          </p>
        </div>
        <div className="rounded-card border border-line bg-bg/40 p-4 lg:col-span-2">
          <h2 className="font-sans text-2xl font-extrabold">Pocket sky</h2>
          <p className="mt-1 text-sm text-v1-muted">Orange is a scent. Tap a star.</p>
          <MiniSky rows={sky} />
        </div>
      </section>

      <div className="mt-4 hidden overflow-x-auto rounded-card border border-line md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-v1-muted">
            <tr className="border-b border-line">
              {["Coin", "Net", "Gross", "Persistence", "Since flip", "Status", "What to do", "Liq. est."].map((h) => (
                <th key={h} className="px-3 py-3 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-b border-line/70">
                <td className="px-3 py-3 font-extrabold">
                  <Link to="/universe" search={{ star: r.symbol }} className="inline-flex min-h-11 items-center gap-2">
                    {r.symbol}
                    {r.alert ? <span className="text-brand">scent</span> : null}
                  </Link>
                </td>
                <td className={cn("px-3 py-3 font-bold", r.alert ? "text-brand" : "text-fg")}>{r.netApr.toFixed(1)}%</td>
                <td className="px-3 py-3">{r.grossApr.toFixed(1)}%</td>
                <td className={cn("px-3 py-3", r.persistence >= 0.5 ? "text-ember" : "text-clay")}>{Math.round(r.persistence * 100)}%</td>
                <td className="px-3 py-3">{r.hoursSinceFlip}h</td>
                <td className="px-3 py-3">{r.status === "ok" ? `ok (${r.n24})` : `building ${r.n24}/144`}</td>
                <td className="px-3 py-3">{r.status === "building history" ? "Wait for the day" : `Long ${r.long}, short ${r.short}`}</td>
                <td className="px-3 py-3">~{r.liqDist.toFixed(0)}%</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-v1-muted">Nothing above that bar.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <ul className="mt-4 grid gap-3 md:hidden">
        {rows.map((r) => (
          <li key={r.symbol} className="rounded-card border border-line bg-surface/70 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <Link to="/universe" search={{ star: r.symbol }} className="font-sans text-xl font-extrabold">
                {r.symbol}
              </Link>
              <span className={cn("font-sans text-2xl font-extrabold", r.alert ? "text-brand" : "text-fg")}>{r.netApr.toFixed(1)}%</span>
            </div>
            <p className="mt-1 text-sm text-v1-muted">
              {r.status === "building history" ? `Building ${r.n24}/144` : `Long ${r.long}, short ${r.short}`}
              {" · "}
              persistence {Math.round(r.persistence * 100)}%
            </p>
          </li>
        ))}
      </ul>

      {watchedRows.length > 0 ? (
        <p className="mt-4 text-sm text-v1-muted">
          Watching {watchedRows.map((r) => r.symbol).join(", ")}. Marked from the sky, kept on this machine.
        </p>
      ) : null}

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-sans text-huge font-extrabold">Sample paper book</h2>
            <SourceTag kind="sample" className="mt-2 text-v1-muted" />
            <p className="mt-2 max-w-xl text-sm text-v1-muted">
              Two open hedges and six closed ones. Notional {money(20, 0)} a leg. Entry already paid about 0.15%. The other 0.15% waits for the exit. Fixed transfer costs live in their own pile.
            </p>
          </div>
          <button type="button" className={btnGhost} onClick={() => exportCsv(opens)}>
            Export sample CSV
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {opens.map((t) => (
            <article key={t.symbol} className="rounded-card border border-line bg-surface/80 p-4">
              <div className="flex items-baseline justify-between">
                <h3 className="font-sans text-2xl font-extrabold">{t.symbol}</h3>
                <span className="text-sm font-bold text-ember">open</span>
              </div>
              <p className="mt-1 font-serif text-lg italic text-ember">
                Long {t.long}, short {t.short}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-v1-muted">Settled hours</dt>
                  <dd className="font-bold">{t.settledHours}</dd>
                </div>
                <div>
                  <dt className="text-v1-muted">Funding so far</dt>
                  <dd className="font-bold">{money(t.funding, 3)}</dd>
                </div>
                <div>
                  <dt className="text-v1-muted">Price PnL</dt>
                  <dd className={cn("font-bold", t.pricePnl < 0 ? "text-clay" : "text-ember")}>{money(t.pricePnl, 3)}</dd>
                </div>
                <div>
                  <dt className="text-v1-muted">Net so far</dt>
                  <dd className={cn("font-bold", t.net < 0 ? "text-clay" : "text-brand")}>{money(t.net, 3)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-v1-muted">{t.watch}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-v1-muted">
              <tr className="border-b border-line">
                {["Coin", "Held", "Funding", "Expected", "Price", "Net", "Exit"].map((h) => (
                  <th key={h} className="px-3 py-3 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLOSED.map((t, i) => (
                <tr key={t.symbol} className="border-b border-line/70">
                  <td className="px-3 py-3 font-extrabold">{t.symbol}</td>
                  <td className="px-3 py-3">{t.hours}h</td>
                  <td className="px-3 py-3">{money(t.funding, 3)}</td>
                  <td className="px-3 py-3">{money(t.expected, 3)}</td>
                  <td className={cn("px-3 py-3", t.pricePnl < 0 ? "text-clay" : "text-fg")}>{money(t.pricePnl, 3)}</td>
                  <td className={cn("px-3 py-3 font-bold", (stats.nets[i] ?? 0) < 0 ? "text-clay" : "text-brand")}>{money(stats.nets[i] ?? 0, 3)}</td>
                  <td className="px-3 py-3 text-v1-muted">{t.exit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Closed trades", `${stats.n}`],
            ["Win rate", `${Math.round((stats.wins / stats.n) * 100)}%`],
            ["Average hold", `${stats.avgHold.toFixed(0)}h`],
            ["Realized / expected", stats.medianRatio.toFixed(2)],
          ].map(([k, v]) => (
            <article key={k} className="rounded-card border border-line bg-bg/40 p-4">
              <p className="text-sm text-v1-muted">{k}</p>
              <p className="mt-1 font-sans text-3xl font-extrabold">{v}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 max-w-3xl font-serif text-2xl italic leading-snug text-ember">
          After variable costs the closed book is {money(stats.total)}. After the {money(stats.fixed, 0)} transfer it is{" "}
          {money(stats.afterFixed)}. Median realized over expected is {stats.medianRatio.toFixed(2)}, range{" "}
          {stats.ratioLo.toFixed(2)}–{stats.ratioHi.toFixed(2)}. Worst mark move {stats.worst.toFixed(0)}%. That is the whole trick at this size, and it is still only paper.
        </p>
        <p className="mt-3 text-sm text-v1-muted">
          Rebalances: {REBALANCE.length}. {REBALANCE[0]?.reason}, {money(REBALANCE[0]?.amount ?? 0, 0)} moved, cost {money(REBALANCE[0]?.cost ?? 0, 0)}. Shown apart from the trades, because one transfer can serve several hedges.
        </p>
      </section>

      <section className="mt-12 rounded-card border border-line bg-surface/60 p-4 md:p-6">
        <h2 className="font-sans text-huge font-extrabold">A year of what-ifs</h2>
        <SourceTag kind="sample" className="mt-2 text-v1-muted" />
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-v1-muted">
          Four thousand made-up years, the same machine as the funding playbook. Change a slider and the odds move. It is not a forecast. Phase 0 exists to replace these guesses with the tape.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Slider label="Capital" min={10} max={200} step={5} value={monteIn.cap} display={money(monteIn.cap, 0)} onChange={(cap) => setMonteIn({ ...monteIn, cap })} />
          <Slider label="Leverage" min={1} max={5} step={0.5} value={monteIn.lev} display={`${monteIn.lev}×`} onChange={(lev) => setMonteIn({ ...monteIn, lev })} />
          <Slider label="Average net spread" min={0} max={60} step={1} value={monteIn.mu} display={`${monteIn.mu}%`} onChange={(mu) => setMonteIn({ ...monteIn, mu })} />
          <Slider label="Jumpiness / day" min={2} max={50} step={1} value={monteIn.vol} display={`${monteIn.vol}`} onChange={(vol) => setMonteIn({ ...monteIn, vol })} />
          <Slider label="Enter above" min={5} max={80} step={1} value={monteIn.thr} display={`${monteIn.thr}%`} onChange={(thr) => setMonteIn({ ...monteIn, thr })} />
          <Slider label="Round trip" min={0.05} max={0.8} step={0.05} value={monteIn.cost} display={`${monteIn.cost.toFixed(2)}%`} onChange={(cost) => setMonteIn({ ...monteIn, cost })} />
          <Slider label="Fixed costs / year" min={0} max={15} step={0.5} value={monteIn.fix} display={money(monteIn.fix, 1)} onChange={(fix) => setMonteIn({ ...monteIn, fix })} />
          <Slider label="Scare / day" min={0} max={1} step={0.05} value={monteIn.liq} display={`${monteIn.liq.toFixed(2)}%`} onChange={(liq) => setMonteIn({ ...monteIn, liq })} />
        </div>
        {monteIn.lev > 2 ? (
          <p className="mt-3 text-sm text-clay">Above the hard rule of 2×. The den will run the what-if. It will not pretend this is allowed live.</p>
        ) : null}
        <button
          type="button"
          className={cn(btn, "mt-4")}
          disabled={running}
          onClick={() => {
            setRunning(true);
            window.setTimeout(() => {
              setMonte(runMonte(monteIn));
              setRunning(false);
            }, 30);
          }}
        >
          {running ? "Running the years…" : "Run 4,000 simulated years"}
        </button>
        {monte ? (
          <div className="mt-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-card border border-line bg-bg/50 p-4">
                <p className={cn("font-sans text-3xl font-extrabold", monte.pLoss > 0.4 ? "text-clay" : "text-ember")}>{(monte.pLoss * 100).toFixed(1)}%</p>
                <p className="mt-1 text-sm text-v1-muted">end the year under {money(monteIn.cap, 0)}</p>
              </article>
              <article className="rounded-card border border-line bg-bg/50 p-4">
                <p className="font-sans text-3xl font-extrabold text-brand">{(monte.p5 * 100).toFixed(1)}%</p>
                <p className="mt-1 text-sm text-v1-muted">chance of beating +5%</p>
              </article>
              <article className="rounded-card border border-line bg-bg/50 p-4">
                <p className="font-sans text-3xl font-extrabold">{money(monte.p50)}</p>
                <p className="mt-1 text-sm text-v1-muted">typical ending balance</p>
              </article>
              <article className="rounded-card border border-line bg-bg/50 p-4">
                <p className="font-sans text-3xl font-extrabold text-clay">{(monte.p5x * 100).toFixed(1)}%</p>
                <p className="mt-1 text-sm text-v1-muted">chance of 5×, such as twenty to a hundred</p>
              </article>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monte.hist}>
                    <Bar dataKey="n" isAnimationActive={false}>
                      {monte.hist.map((h, i) => (
                        <Cell key={`${h.label}-${i}`} fill={h.loss ? palette.clay : palette.brand} />
                      ))}
                    </Bar>
                    <Tooltip {...tip} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monte.fan}>
                    <XAxis dataKey="week" hide />
                    <Line type="monotone" dataKey="hi" stroke={palette.ember} dot={false} strokeWidth={1} isAnimationActive={false} />
                    <Line type="monotone" dataKey="mid" stroke={palette.brand} dot={false} strokeWidth={2} isAnimationActive={false} />
                    <Line type="monotone" dataKey="lo" stroke={palette.clay} dot={false} strokeWidth={1} isAnimationActive={false} />
                    <Tooltip {...tip} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="mt-3 text-sm text-v1-muted">
              Bad year {money(monte.p10)} · median {money(monte.p50)} · good year {money(monte.p90)}. Time inside a trade{" "}
              {(monte.inPos * 100).toFixed(0)}%. Left chart: where the 4,000 years ended (clay is a loss). Right: the middle 80% through the year, brand line is the median.
            </p>
          </div>
        ) : null}
      </section>

      <p className="mt-10 max-w-3xl text-xs leading-relaxed text-faint">
        Not financial advice. HedgeHound does not place orders and it will not help reach an exchange you are not allowed to use. Check the venue’s terms and your local rules before any real money. At this size this is a classroom, not a paycheck. No figure on this page is a forecast. Field sample, shaped like the scanner’s rules — the Windows poller still owns the tape.
      </p>
    </div>
  );
}
