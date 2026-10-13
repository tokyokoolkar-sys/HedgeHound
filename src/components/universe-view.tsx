import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { SourceTag } from "@/components/edition/source-tag";
import { WebglBoundary } from "@/components/webgl-boundary";
import { cn } from "@/lib/cn";
import { palette } from "@/lib/palette";
import {
  allRows,
  DEFAULT_BOOK,
  readBook,
  readWatch,
  SECTORS,
  usdCompact,
  writeWatch,
  type BookSettings,
  type Focus,
  type Row,
  type Sector,
} from "@/lib/scent";
import { btn, btnGhost } from "@/lib/ui";

const loadSky = () => import("@/components/three/universe-scene");

function Dossier({
  row,
  watched,
  onWatch,
  onClose,
}: {
  row: Row;
  watched: boolean;
  onWatch: () => void;
  onClose: () => void;
}) {
  const spark = row.trail.map((y, i) => ({ i, y }));
  return (
    <article className="rounded-card border border-line bg-bg/80 p-4 text-fg shadow-none backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wide text-ember">{SECTORS[row.sector].name}</p>
          <h2 className="font-sans text-3xl font-extrabold tracking-tight">{row.symbol}</h2>
          <SourceTag kind="sample" className="mt-1 text-v1-muted" />
        </div>
        <button type="button" className={btnGhost} onClick={onClose}>
          Pull back
        </button>
      </div>
      <p className="mt-2 font-serif text-lg italic leading-snug text-ember">{row.blurb}</p>
      {row.status !== "filtered" ? (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-v1-muted">Net APR</dt>
              <dd className={cn("font-sans text-2xl font-extrabold", row.alert ? "text-brand" : "text-fg")}>
                {row.netApr.toFixed(1)}%
              </dd>
            </div>
            <div>
              <dt className="text-v1-muted">Gross APR</dt>
              <dd className="font-sans text-2xl font-extrabold">{row.grossApr.toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-v1-muted">Lighter</dt>
              <dd className="font-bold">{row.lighterApr.toFixed(1)}% APR</dd>
            </div>
            <div>
              <dt className="text-v1-muted">Binance</dt>
              <dd className="font-bold">{row.binanceApr.toFixed(1)}% APR</dd>
            </div>
          </dl>
          <div className="mt-4 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spark}>
                <Line type="monotone" dataKey="y" stroke={palette.brand} dot={false} strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-xs text-faint">Signed spread, APR, across the field sample.</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div>
              <dt className="text-v1-muted">Persistence</dt>
              <dd className="font-bold">{Math.round(row.persistence * 100)}%</dd>
            </div>
            <div>
              <dt className="text-v1-muted">Since flip</dt>
              <dd className="font-bold">{row.hoursSinceFlip}h</dd>
            </div>
            <div>
              <dt className="text-v1-muted">Window</dt>
              <dd className="font-bold">{row.windowH}h · {row.n24} samples</dd>
            </div>
            <div>
              <dt className="text-v1-muted">Liq. distance</dt>
              <dd className="font-bold">~{row.liqDist.toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-v1-muted">Lighter book</dt>
              <dd className="font-bold">{usdCompact(row.volL)} · oi {usdCompact(row.oiL)}</dd>
            </div>
            <div>
              <dt className="text-v1-muted">Binance book</dt>
              <dd className="font-bold">{usdCompact(row.volB)} · oi {usdCompact(row.oiB)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm font-bold">
            {row.status === "building history"
              ? "Still building a day of tape."
              : `Long ${row.long}, short ${row.short}.`}
          </p>
        </>
      ) : null}
      <p className="mt-2 text-sm leading-relaxed text-v1-muted">{row.note}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {row.status !== "filtered" ? (
          <button type="button" className={btn} onClick={onWatch}>
            {watched ? "Watching" : "Watch this scent"}
          </button>
        ) : null}
        <span
          className={cn(
            "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold",
            row.alert ? "bg-brand/15 text-brand" : "bg-surface text-v1-muted",
          )}
        >
          {row.alert ? "Alert-eligible" : row.status === "ok" ? "Not a scent" : row.status}
        </span>
      </div>
    </article>
  );
}

export function UniverseView({ initialStar }: { initialStar?: string }) {
  const navigate = useNavigate();
  const [book, setBook] = useState<BookSettings>(DEFAULT_BOOK);
  const [focus, setFocus] = useState<Focus>(initialStar ? { type: "star", symbol: initialStar } : null);
  const [watch, setWatch] = useState<string[]>([]);
  const [still, setStill] = useState(false);
  const [Sky, setSky] = useState<typeof import("@/components/three/universe-scene").UniverseScene | null>(null);

  useEffect(() => {
    setBook(readBook());
    setWatch(readWatch());
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let live = true;
    loadSky().then((m) => {
      if (live) setSky(() => m.UniverseScene);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") choose(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // choose is stable enough via focus in closure; rebind when focus identity changes is unnecessary
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => allRows(book), [book]);
  const focused = focus?.type === "star" ? rows.find((r) => r.symbol === focus.symbol) : undefined;
  const sectorLine = focus?.type === "sector" ? SECTORS[focus.sector] : null;

  function choose(next: Focus) {
    setFocus(next);
    void navigate({
      to: "/universe",
      search: { star: next?.type === "star" ? next.symbol : undefined },
      replace: true,
    });
  }

  function toggleWatch(symbol: string) {
    setWatch((curr) => {
      const next = curr.includes(symbol) ? curr.filter((s) => s !== symbol) : [...curr, symbol];
      writeWatch(next);
      return next;
    });
  }

  const groups = (Object.keys(SECTORS) as Sector[]).map((sector) => ({
    sector,
    rows: rows.filter((r) => r.sector === sector),
  }));

  return (
    <div className="night relative h-full">
      <div className="absolute inset-0">
        <WebglBoundary>
          {Sky ? (
            <Sky rows={rows} focus={focus} still={still} onPick={(symbol) => choose({ type: "star", symbol })} onMiss={() => choose(null)} />
          ) : (
            <p className="sr-only">Sky is focusing.</p>
          )}
        </WebglBoundary>
      </div>

      <aside className="absolute top-20 bottom-4 left-4 z-10 hidden w-56 overflow-auto lg:block">
        <p className="px-2 text-xs font-bold tracking-wide text-ember">The sky</p>
        <p className="px-2 pt-1 text-xs leading-relaxed text-v1-muted">
          Move the pointer. Click a star. The camera goes in.
        </p>
        {groups.map((g) => (
          <div key={g.sector} className="mt-3">
            <button
              type="button"
              className={cn(
                "flex min-h-11 w-full items-center rounded-full px-3 text-left text-sm font-extrabold",
                focus?.type === "sector" && focus.sector === g.sector ? "bg-brand text-bg" : "text-fg",
              )}
              onClick={() => choose({ type: "sector", sector: g.sector })}
            >
              {SECTORS[g.sector].name}
            </button>
            {g.rows.map((r) => (
              <button
                key={r.symbol}
                type="button"
                className={cn(
                  "flex min-h-11 w-full items-center justify-between rounded-full px-3 text-left text-sm font-bold",
                  focus?.type === "star" && focus.symbol === r.symbol ? "bg-surface text-brand" : "text-v1-muted",
                )}
                onClick={() => choose({ type: "star", symbol: r.symbol })}
              >
                <span>{r.symbol}</span>
                {r.alert ? <span className="text-brand">scent</span> : null}
              </button>
            ))}
          </div>
        ))}
      </aside>

      <div className="pointer-events-none absolute top-20 right-4 left-4 z-10 flex justify-center lg:left-64 lg:justify-start">
        <p className="pointer-events-auto max-w-md rounded-full border border-line bg-bg/70 px-4 py-2 text-center text-xs font-bold text-v1-muted backdrop-blur-md">
          {sectorLine
            ? sectorLine.line
            : focused
              ? focused.symbol
              : "Constellations of the field sample. Orange stars clear the house bar."}
        </p>
      </div>

      {focused ? (
        <div className="absolute inset-x-3 bottom-24 z-20 max-h-80 overflow-auto lg:inset-x-auto lg:top-36 lg:right-4 lg:bottom-4 lg:w-96 lg:max-h-none">
          <Dossier
            row={focused}
            watched={watch.includes(focused.symbol)}
            onWatch={() => toggleWatch(focused.symbol)}
            onClose={() => choose(null)}
          />
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-20 flex gap-2 overflow-x-auto px-3 py-3 lg:hidden">
        {rows.map((r) => (
          <button
            key={r.symbol}
            type="button"
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full border border-line bg-bg/80 px-3 text-sm font-bold backdrop-blur-md",
              focus?.type === "star" && focus.symbol === r.symbol ? "text-brand" : "text-fg",
            )}
            onClick={() => choose({ type: "star", symbol: r.symbol })}
          >
            {r.symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
