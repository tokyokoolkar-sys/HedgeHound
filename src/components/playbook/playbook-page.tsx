"use client"
// /playbook (T32): the strategy as written, ported from WhaleHunterAlt's docs/funding-spread-playbook.html
// (with docs/01-strategy.md and 03-risk-rules.md), in the source's order and words; the access paragraph is
// verbatim (owner, T32). A reading page on the quiet sky: one column, headings that sharpen with the scroll,
// a contents rail on wide screens. Its figures are rules and plans, not readings, so they carry no SourceTag;
// the one outside claim stays marked unverified. The source's Monte Carlo lives in the den.
import { Link } from "@/lib/nav"
import { useRef, type ReactNode } from "react"
import { cn } from "@/lib/cn"
import { band } from "@/lib/motion/math"
import { resolveIn } from "@/lib/motion/choreo"
import { useRequestSky } from "@/lib/stage/request-sky"
import { applyLook } from "../edition/look"
import { useScrollFrame } from "../edition/use-scroll-frame"

const GUTTER = "px-[max(16px,7vw)]"

type Section = { id: string; title: string; short: string; body: ReactNode }

const B = ({ children }: { children: ReactNode }) => <b className="font-normal text-starlight">{children}</b>

/** Term + description rows on hairlines (risks, the scanner spec). */
function Terms({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="m-0 grid">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 border-t border-starlight-faint py-3 sm:grid-cols-[9.5rem_1fr] sm:gap-4">
          <dt className="label pt-1.5 text-starlight">{k}</dt>
          <dd className="m-0">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

const ROADMAP: Array<{ n: string; when?: string; what: string; pass: string; here?: boolean }> = [
  { n: "0", when: "weeks 1–4", what: "Scanner + alerts, paper trades only", pass: "Spread lasts longer than the round-trip cost payback", here: true },
  { n: "1", what: "$20 live, 1 symbol, 2× leverage, manual", pass: "No leg closer than 40% to liquidation; net positive after all costs" },
  { n: "2", what: "$50 to $100, 2–3 symbols", pass: "Two months at or above 5% annualized net" },
  { n: "3", what: "Semi-automatic order placement via API", pass: "Zero unhedged minutes in logs" },
]

const RULES = [
  "Max 2× leverage per leg. Split capital about 50/50 across venues.",
  "Isolated margin. Keep each leg’s liquidation price at least 40% away from entry.",
  "Never hold one leg alone: if one order fails, close the other immediately.",
  "Exit when net spread drops under half your entry threshold, or after 7 days to re-evaluate.",
  "One symbol at $20, at most three at $100. No new coins with less than 30 days of history.",
  "Kill switch: stop if cumulative loss reaches 25% of the research budget.",
  "Log every action. Review weekly: expected vs realized spread.",
]

const SOURCES: Array<{ href: string; name: string; note: string }> = [
  { href: "https://docs.lighter.xyz/trading/funding", name: "Lighter funding docs", note: "hourly funding, clamped rate." },
  {
    href: "https://arxiv.org/abs/2212.06888v6",
    name: "Fundamentals of Perpetual Futures (arXiv)",
    note: "arbitrage yields high Sharpe, deviations shrink over time, not risk-free.",
  },
  { href: "https://hummingbot.org/exchanges/lighter/", name: "Hummingbot Lighter connector", note: "API keys signed by your wallet." },
  { href: "https://defillama.com/protocol/lighter-perps", name: "DefiLlama: Lighter", note: "volume and fee data." },
  { href: "https://www.sharpe.ai/arbitrage/cross-exchange-arbitrage", name: "Sharpe cross-exchange scanner", note: "vendor spread claims (unverified)." },
]

const SECTIONS: Section[] = [
  {
    id: "plain-words",
    title: "What we are doing, in plain words",
    short: "in plain words",
    body: (
      <>
        <p>
          <B>Funding</B> is a payment between longs and shorts, every hour on Lighter and usually every 8 hours on Binance. If the same coin pays you more on
          one exchange than it costs you on the other, you hold a long on the cheap side and a short on the expensive side. Price moves cancel; you keep the
          gap.
        </p>
        <p>
          <B>Honest sizing.</B> At roughly 10 to 40% a year gross (<span className="text-starlight">vendor claims, unverified</span>) and after costs, $20
          earns a few dollars a year. $20 to $100 is not reachable by this method. $50 at 5% ($2.50) is. The real payoffs are learning the system and possible
          Lighter points.
        </p>
      </>
    ),
  },
  {
    id: "risks",
    title: "Risks you can see",
    short: "risks",
    body: (
      <Terms
        rows={[
          ["Liquidation of one leg", "If price spikes and the margin buffer is thin. This is the main way to lose real money."],
          ["Spread closes or flips", "After you enter. Funding mean-reverts, so entries can pay less than expected."],
          ["Fixed costs", "Lighter withdraw/transfer fees and Ethereum gas can exceed profit at $20."],
          ["Venue risk", "Outages, frozen accounts, smart-contract or oracle problems."],
        ]}
      />
    ),
  },
  {
    id: "roadmap",
    title: "Roadmap",
    short: "roadmap",
    body: (
      <ol className="m-0 grid list-none p-0">
        {ROADMAP.map((p) => (
          <li key={p.n} className="grid grid-cols-[3rem_1fr] gap-x-4 border-t border-starlight-faint py-4">
            <span className="font-light-display text-title leading-none text-starlight">{p.n}</span>
            <span className="grid gap-1.5">
              <span className="label flex flex-wrap gap-x-3 text-starlight-dim">
                <span>phase {p.n}</span>
                {p.when && <span>{p.when}</span>}
                {p.here && <span className="text-scan">you are here</span>}
              </span>
              <span className="text-starlight">{p.what}</span>
              <span>
                <span className="label mr-2 text-starlight-dim">pass</span>
                {p.pass}
              </span>
            </span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: "access",
    title: "Access and compliance",
    short: "access",
    body: (
      <p>
        You said Binance should be blocked in Indonesia. I can’t verify your status and won’t help work around a restriction. Check each exchange’s terms and
        local rules before funding anything; an account frozen mid-trade leaves one leg unhedged. Also unverified: connecting Binance Wallet to Lighter. Lighter
        uses wallet-signed API keys, so a standard Ethereum wallet should work; test it with a tiny deposit.
      </p>
    ),
  },
  {
    id: "monte-carlo",
    title: "Monte Carlo: 1 year of this strategy",
    short: "monte carlo",
    body: (
      <>
        <p>
          This runs thousands of random years using your assumptions. It is a what-if, not a forecast: change a slider and see how the odds move.
        </p>
        <p className="label m-0">
          <Link
            to="/den"
            hash="what-ifs"
            className="inline-flex min-h-11 items-center text-starlight underline decoration-starlight-faint decoration-1 underline-offset-[6px] hover:decoration-starlight focus-visible:text-scan"
          >
            A year of what-ifs runs in the den →
          </Link>
        </p>
      </>
    ),
  },
  {
    id: "scanner-spec",
    title: "Scanner spec",
    short: "scanner spec",
    body: (
      <Terms
        rows={[
          [
            "Data",
            <>
              Lighter funding via its public API, Binance via <code className="font-mono text-[0.9em] text-starlight">/fapi/v1/premiumIndex</code>. Poll every
              5 minutes. Read each venue’s funding interval from the API; never assume 1h or 8h.
            </>,
          ],
          ["Normalize", "Hourly rate = rate / interval hours. APR = hourly × 8760."],
          ["Net spread", "= |Lighter hourly − Binance hourly| minus (Binance fee + slippage) amortized over expected hold hours."],
          [
            "Filters",
            "Symbol on both venues; Lighter 24h volume and open interest above a floor; spread persisted at least 3 of the last 6 hours (not a one-off spike).",
          ],
          ["Direction", "Long the venue with the lower hourly rate, short the higher one."],
          [
            "Alert",
            "(Telegram): symbol, direction, net APR, break-even hours, liquidation distance for both legs at your leverage, history of the last 7 days.",
          ],
          ["Odds display", "For each alert show the share of past hours the spread stayed above entry threshold for 24h (empirical, from stored history)."],
          [
            "Build notes",
            "Python, SQLite for history, Hummingbot has a Lighter perp connector if you later automate. Paper log: every alert gets a simulated entry and exit so Phase 0 produces real numbers.",
          ],
        ]}
      />
    ),
  },
  {
    id: "risk-rules",
    title: "Risk rules",
    short: "risk rules",
    body: (
      <ol className="m-0 grid list-none p-0">
        {RULES.map((r, i) => (
          <li key={r} className="grid grid-cols-[2.5rem_1fr] items-baseline gap-x-3 border-t border-starlight-faint py-3">
            <span className="font-mono text-sm tabular-nums text-starlight-dim">{String(i + 1).padStart(2, "0")}</span>
            <span>{r}</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: "sources",
    title: "Sources checked",
    short: "sources",
    body: (
      <>
        <ul className="m-0 grid list-none p-0">
          {SOURCES.map((s) => (
            <li key={s.href} className="border-t border-starlight-faint py-3">
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-starlight underline decoration-starlight-faint decoration-1 underline-offset-[6px] hover:decoration-starlight focus-visible:text-scan"
              >
                {s.name}
              </a>
              <span>: {s.note}</span>
            </li>
          ))}
        </ul>
        <p className="label tracking-wide normal-case">Open question: the Monte Carlo defaults are my assumptions, not measured data. Phase 0 replaces them with real numbers.</p>
      </>
    ),
  },
]

export function PlaybookPage() {
  useRequestSky("quiet")
  const scroller = useRef<HTMLDivElement>(null)
  const heads = useRef<Array<HTMLHeadingElement | null>>([])
  const rail = useRef<HTMLElement>(null)

  // Headings sharpen as they rise over the bottom edge, locked to the scroll and reversible. The band is the
  // last tenth of the view and the blur is light, so a heading a reader stops on is already crisp.
  useScrollFrame((s) => {
    const vh = window.innerHeight
    let active = 0
    heads.current.forEach((h, i) => {
      if (!h) return
      const top = h.getBoundingClientRect().top
      applyLook(h, s.reduced ? resolveIn(1) : resolveIn(band(vh - top, 0, vh * 0.1), 10, 5), false)
      if (top < vh * 0.4) active = i
    })
    rail.current?.querySelectorAll<HTMLElement>("[data-i]").forEach((a) => {
      const on = Number(a.dataset.i) === active
      if (a.hasAttribute("data-on") !== on) a.toggleAttribute("data-on", on)
      if (on) a.setAttribute("aria-current", "true")
      else a.removeAttribute("aria-current")
    })
  })

  const jump = (i: number) => {
    const h = heads.current[i]
    const sc = scroller.current
    if (!h || !sc) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    sc.scrollTo({ top: h.offsetTop - 24, behavior: reduced ? "instant" : "smooth" })
  }

  return (
    // The text scrolls in its own region under the nav, so it clips at the nav's edge instead of sliding under it.
    <main className="relative z-10 flex h-dvh flex-col overflow-hidden pt-16">
      <div
        ref={scroller}
        data-lenis-prevent
        className={cn(GUTTER, "relative min-h-0 flex-1 overflow-y-auto overscroll-contain pb-32 [scrollbar-color:var(--color-starlight-faint)_transparent] [scrollbar-width:thin]")}
      >
        <article className="text-body grid w-full max-w-[640px] gap-16 text-starlight-dim [&_p]:m-0">
          <header className="grid gap-4 pt-6 md:pt-10">
            <p className="label m-0 text-starlight-dim">the playbook · from WhaleHunterAlt’s docs</p>
            <h1 className="m-0 font-light-display text-title text-starlight">Funding Spread Playbook</h1>
            <p className="text-subtitle italic text-starlight">
              Lighter × Binance Futures. A small-capital plan: scan for funding gaps, alert, paper-track, then go live with $20. Not financial advice; you can
              lose money.
            </p>
          </header>
          {SECTIONS.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="grid gap-5">
              <h2 id={`${s.id}-h`} ref={(el) => void (heads.current[i] = el)} className="m-0 font-light-display text-subtitle text-starlight">
                {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>

      {/* Contents (wide screens): the section you are in is lit cyan, as on the α–κ rail. */}
      <nav ref={rail} aria-label="Contents" className="fixed top-1/2 right-[max(16px,7vw)] hidden -translate-y-1/2 xl:block">
        <ol className="m-0 grid list-none gap-1 p-0">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                data-i={i}
                onClick={(e) => {
                  e.preventDefault()
                  jump(i)
                }}
                className="label inline-flex min-h-8 items-center text-starlight-dim transition-colors duration-300 hover:text-starlight focus-visible:text-scan data-[on]:text-scan"
              >
                {s.short}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </main>
  )
}
