import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { SourceTag } from "@/components/edition/source-tag";
import { Tear } from "@/components/tear";
import { WebglBoundary } from "@/components/webgl-boundary";
import { palette } from "@/lib/palette";
import { allRows, DEFAULT_BOOK, MIN_OI, MIN_VOL, STARS, trailFor, usdCompact } from "@/lib/scent";
import { btn, btnGhost } from "@/lib/ui";

const PEEK = allRows().filter((r) => r.alert);
const TAPE = allRows().filter((r) => r.status === "ok");
// The ARB card reads its figures from the sample row; nothing on it is typed in by hand.
const ARB = allRows().find((r) => r.symbol === "ARB") ?? allRows()[0];
const apr0 = (n: number) => `${Math.round(n)}%`;
const HUB_CHART = trailFor(STARS.find((s) => s.symbol === "ARB") ?? STARS[0]).map((y, i) => ({ i, y }));

const CLOUD = [
  { word: "Persistence", left: "4%", top: "12%" },
  { word: "144 samples", left: "18%", top: "78%" },
  { word: `${DEFAULT_BOOK.cost.toFixed(2)}% round trip`, left: "72%", top: "16%" },
  { word: "2× isolated", left: "80%", top: "70%" },
  { word: "30-day listing", left: "8%", top: "48%" },
  { word: `${usdCompact(MIN_VOL)} volume`, left: "62%", top: "84%" },
  { word: `${usdCompact(MIN_OI)} open interest`, left: "70%", top: "42%" },
  { word: "Sign flip", left: "40%", top: "8%" },
  { word: "Poll · 5 min", left: "84%", top: "48%" },
  { word: "Status ok", left: "14%", top: "88%" },
  { word: "No naked leg", left: "46%", top: "86%" },
  { word: "Kill switch", left: "88%", top: "28%" },
];

const CARDS = [
  { title: "Short the rich hour", body: "Where funding is higher, you want to be short. You collect." },
  { title: "Long the cheap hour", body: "Where funding is lower, you want to be long. You pay less, or you get paid." },
  { title: "If one leg fails", body: "Flatten the other. A naked leg is just a bet the hound refused to make." },
  { title: "Paper, until the fare fits", body: "Transfers can cost more than a week of spread at $20. Measure that before you fund it." },
];

function Marquee({ reverse, items }: { reverse?: boolean; items: typeof TAPE }) {
  const row = [...items, ...items];
  return (
    <div className="marquee overflow-hidden border-y border-line/80 bg-bg/40 py-3">
      <div className={reverse ? "marquee-track marquee-rev gap-8 px-4" : "marquee-track gap-8 px-4"}>
        {row.map((r, i) => (
          <span key={`${r.symbol}-${i}`} className="flex items-center gap-3 whitespace-nowrap font-sans text-sm font-bold">
            <span className={r.alert ? "text-fg" : "text-v1-muted"}>{r.symbol}</span>
            <span className={r.alert ? "text-brand" : "text-faint"}>{r.netApr.toFixed(1)}%</span>
            {r.alert ? <span className="text-ember">scent</span> : <span className="text-faint">quiet</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function useScene<T>(loader: () => Promise<T>) {
  const [mod, setMod] = useState<T | null>(null);
  useEffect(() => {
    let live = true;
    loader().then((m) => {
      if (live) setMod(m);
    });
    return () => {
      live = false;
    };
  }, [loader]);
  return mod;
}

const loadSniff = () => import("@/components/three/sniff-scene");
const loadHub = () => import("@/components/three/hub-scene");

export function HeroFilm() {
  const root = useRef<HTMLDivElement>(null);
  const sniffP = useRef(0);
  const hubP = useRef(0);
  const sniffMod = useScene(loadSniff);
  const hubMod = useScene(loadHub);
  const [charts, setCharts] = useState(false);

  useEffect(() => {
    setCharts(true);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const narrow = window.innerWidth < 768;
    let revert: (() => void) | undefined;
    let cancel = false;

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancel || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        gsap.timeline({
          scrollTrigger: {
            trigger: ".ch-open",
            start: "top top",
            end: narrow ? "+=80%" : "+=150%",
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            onUpdate: (self) => {
              sniffP.current = self.progress;
            },
          },
        }).to(".open-title", { y: -28, scale: 0.92, ease: "none", duration: 1 }, 0);

        gsap.to(".para-back", {
          y: narrow ? -30 : -90,
          ease: "none",
          scrollTrigger: { trigger: ".ch-story", start: "top bottom", end: "bottom top", scrub: true },
        });
        gsap.to(".para-mid", {
          y: narrow ? -16 : -48,
          ease: "none",
          scrollTrigger: { trigger: ".ch-story", start: "top bottom", end: "bottom top", scrub: true },
        });

        if (!narrow) {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: ".ch-agent",
                start: "top top",
                end: "+=160%",
                pin: true,
                scrub: 0.7,
                anticipatePin: 1,
                onUpdate: (self) => {
                  hubP.current = self.progress;
                },
              },
            })
            .to(".hub-chart", { opacity: 0.28, ease: "none", duration: 1 }, 0);
        } else {
          ScrollTrigger.create({
            trigger: ".ch-agent",
            start: "top 70%",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              hubP.current = self.progress;
            },
          });
        }
      }, node);
      revert = () => ctx.revert();
      void document.fonts?.ready.then(() => ScrollTrigger.refresh());
    })();

    return () => {
      cancel = true;
      revert?.();
    };
  }, []);

  return (
    <div ref={root}>
      <section className="ch-open night relative h-svh overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <WebglBoundary>
            {sniffMod ? <sniffMod.SniffScene progressRef={sniffP as MutableRefObject<number>} /> : null}
          </WebglBoundary>
        </div>
        <p
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-sans text-mega font-extrabold text-fg/5"
        >
          SNIFF
        </p>
        <div className="open-title relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-5 pb-24 text-center">
          <p className="text-sm font-bold tracking-wide text-ember">Phase 0 · paper only</p>
          <h1 className="mt-3 font-sans text-mega font-extrabold text-fg">
            <span className="block">Hedge</span>
            <span className="block text-brand">Hound</span>
          </h1>
          <p className="mt-5 max-w-xl font-serif text-2xl italic leading-snug text-ember md:text-3xl">
            <span className="mr-1 font-serif text-5xl leading-none text-brand not-italic md:text-6xl">I</span>
            t does not chase price. It sniffs the hour.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-v1-muted md:text-base">
            Same coin, two venues. Long where hourly funding is cheaper, short where it is richer. The move
            cancels. The gap is the catch — if it lasts longer than the ticket.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {PEEK.map((r) => (
              <Link
                key={r.symbol}
                to="/universe"
                search={{ star: r.symbol }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-bg/55 px-4 text-sm font-bold backdrop-blur-md"
              >
                <span>{r.symbol}</span>
                <span className="text-brand">{r.netApr.toFixed(1)}%</span>
              </Link>
            ))}
            <SourceTag kind="sample" className="text-v1-muted" />
          </div>
          <p className="scroll-hint mt-8 text-xs font-bold tracking-wide text-faint">Scroll the scent</p>
        </div>
        <Tear tone="cream" className="absolute inset-x-0 bottom-0 z-20" />
      </section>

      <section className="ch-story paper relative overflow-hidden">
        <p
          aria-hidden
          className="para-back pointer-events-none absolute -left-2 top-6 font-sans text-mega font-extrabold text-ink/5 md:left-4 md:top-10"
        >
          8760
        </p>
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-7">
            <p className="text-sm font-bold text-scorch">Why it works</p>
            <h2 className="mt-2 font-sans text-huge font-extrabold text-ink">Why the hedge holds</h2>
            <p className="dropcap mt-6 max-w-xl text-base leading-relaxed text-ink md:text-lg">
              Funding is a toll between longs and shorts. On Lighter it is taken every hour. On Binance Futures
              it is usually every eight hours, sometimes four. A positive rate means longs pay shorts. HedgeHound
              does not guess the next candle. It asks which venue is charging more for the same coin, this hour.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article>
                <h3 className="font-sans text-lg font-extrabold text-ink">Normalize</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Hourly equals the printed rate divided by the interval. Lighter’s public rate is eight-hour
                  scale, so the hour is that rate divided by eight.
                </p>
              </article>
              <article>
                <h3 className="font-sans text-lg font-extrabold text-ink">Cancel</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Long the cheap hour, short the rich one, about the same notional. A spike hits both legs. What
                  should remain is the spread.
                </p>
              </article>
              <article>
                <h3 className="font-sans text-lg font-extrabold text-ink">Doubt</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Net APR subtracts the round trip, amortized over the hold you actually expect. A fat snapshot
                  that dies in an hour never paid the ticket.
                </p>
              </article>
            </div>
          </div>
          <div className="para-mid md:col-span-5">
            <div className="rounded-card border border-ink/10 bg-cream-2/80 p-5 backdrop-blur-sm">
              <p className="font-serif text-xl italic text-ink">ARB, in this field sample</p>
              <SourceTag kind="sample" className="mt-2 text-ink-soft" />
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-ink-soft">Lighter hour</dt>
                  <dd className="font-sans text-2xl font-extrabold text-scorch">{apr0(ARB.lighterApr)} APR</dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Binance hour</dt>
                  <dd className="font-sans text-2xl font-extrabold text-ink">{apr0(ARB.binanceApr)} APR</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Short {ARB.short}, long {ARB.long}. Gross gap about {apr0(ARB.grossApr)} APR. After a{" "}
                {DEFAULT_BOOK.cost.toFixed(2)}% round trip held for {DEFAULT_BOOK.hold} hours, net is about{" "}
                {apr0(ARB.netApr)}. That is the scent. It is not a promise, and it is not an order.
              </p>
              <p className="mt-4 font-serif text-lg italic text-ink">
                hourly = rate / interval
                <br />
                APR = hourly × 8760
              </p>
            </div>
          </div>
        </div>
        <ul className="relative mx-auto flex max-w-6xl flex-wrap gap-2 px-5 pb-16 text-sm font-bold text-ink">
          {[
            "Max 2×, isolated",
            "Liquidation at least ~40% away",
            "Never one naked leg",
            "One symbol at $20",
            "No coin younger than 30 days",
            "Stop at −25% of the budget",
          ].map((rule) => (
            <li key={rule} className="rounded-full border border-ink/15 bg-cream px-4 py-2">
              {rule}
            </li>
          ))}
        </ul>
      </section>

      <section className="paper relative overflow-hidden">
        <p
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 font-sans text-mega font-extrabold text-ink/5"
        >
          CLOUD
        </p>
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          {CLOUD.map((c, i) => (
            <span
              key={c.word}
              className="float-chip absolute rounded-full border border-ink/10 bg-cream/80 px-4 py-2 text-sm font-bold text-ink-soft backdrop-blur-sm"
              style={{ left: c.left, top: c.top, animationDelay: `${i * 0.35}s` }}
            >
              {c.word}
            </span>
          ))}
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm font-bold text-scorch">The sidekick</p>
            <h2 className="mt-2 font-sans text-huge font-extrabold text-ink">Names, drifting</h2>
            <p className="mt-4 font-serif text-2xl italic leading-snug text-ink">
              The scanner is a pile of tests, not a trigger finger.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft md:text-base">
              A row becomes a scent only when the day-average net clears your bar, the sign has held, both books
              are thick enough, and the coin is old enough. Until then it is just weather.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2 lg:hidden">
            {CLOUD.map((c) => (
              <span key={c.word} className="rounded-full border border-ink/15 bg-cream px-3 py-2 text-sm font-bold text-ink">
                {c.word}
              </span>
            ))}
          </div>
          <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-2">
            {CARDS.map((card) => (
              <article key={card.title} className="rounded-card border border-ink/10 bg-cream-2/95 p-4 backdrop-blur-sm">
                <h3 className="font-sans text-lg font-extrabold text-ink">{card.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ch-agent night relative overflow-hidden">
        <Tear tone="dark" className="absolute inset-x-0 top-0 z-20 -translate-y-[62%]" />
        <div className="mx-auto grid min-h-svh max-w-6xl items-center gap-6 px-5 pt-24 pb-8 md:grid-cols-2 md:pt-20">
          <div className="relative h-80 md:h-[68vh]">
            <p
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center font-sans text-mega font-extrabold text-fg/10"
            >
              HUB
            </p>
            <SourceTag kind="sample" className="absolute bottom-2 left-2 z-20 text-v1-muted" />
            <div className="hub-chart pointer-events-none absolute inset-0 z-0 opacity-80">
              {charts ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={HUB_CHART}>
                    <Area
                      type="monotone"
                      dataKey="y"
                      stroke={palette.ember}
                      fill={palette.brand}
                      fillOpacity={0.22}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
            <div className="pointer-events-none absolute inset-0 z-10">
              <WebglBoundary>
                {hubMod ? <hubMod.HubScene progressRef={hubP as MutableRefObject<number>} /> : null}
              </WebglBoundary>
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-ember">The position</p>
            <h2 className="mt-2 font-sans text-huge font-extrabold">One coin. Two legs.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-v1-muted md:text-base">
              The hub sits in front of the spread. It grows as you give the scroll away — a stand-in for the
              position itself, which only deserves size when the gap pays its ticket.
            </p>
            <p className="agent-extra mt-4 max-w-md font-serif text-xl italic text-ember md:text-2xl">
              At twenty dollars this is a classroom, not a paycheck. No figure here is a forecast. Not a ladder
              from twenty to a hundred.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/universe" className={btn}>
                Enter the sky
              </Link>
              <Link to="/den" className={btnGhost}>
                Open the den
              </Link>
            </div>
          </div>
        </div>
        <p className="px-5 pb-2 text-center">
          <SourceTag kind="sample" className="text-faint" />
        </p>
        <Marquee items={TAPE} />
        <Marquee reverse items={[...TAPE].reverse()} />
        <p className="px-5 py-8 text-center text-xs leading-relaxed text-faint">
          Not financial advice. Paper only. No order ticket, and no way around an exchange’s rules. Field sample
          — your local scanner still owns the tape.
        </p>
      </section>
    </div>
  );
}
