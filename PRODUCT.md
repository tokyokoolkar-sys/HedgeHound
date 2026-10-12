# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

TanStack Start + React 19 + Vite + Tailwind v4 + R3F + GSAP

## Users

- **Primary: the owner, a solo operator** on a local Windows PC. Job: monitor Lighter × Binance funding-rate spreads, review alerts and paper results, and decide by hand whether any hedged trade is worth placing.
- **Secondary: showcase viewers.** The owner also shows the Edition to other people (portfolio, demo, pitch). They are not operators and may not know funding rates or delta-neutral hedging. The Edition has to make sense to them without the owner narrating, while staying a working tool for the owner.

## Product Purpose

HedgeHound is the front end for the owner's local funding-spread scanner. The `/` route is "The Can✶s Edition": a long-scroll editorial overview in ten chapters that explains the strategy and shows the live field. It sits on top of working views: `/scanner` (sortable live table), `/sky` (every coin charted), `/den` (paper desk), and `/playbook` (rules and method).
Success for the owner: judge opportunities in seconds without opening a terminal. Success for a showcase viewer: understand what a funding spread is, why the hedge cancels price, and what the scanner is measuring right now.
It never places trades.

## Positioning

A delta-neutral funding-spread tool that shows its own workings: live local measurements, a clearly labelled paper stage, no invented yields. The "hound" motif (sniffing out spreads, guarding the hedge) is the owner's chosen identity, and Canis Major makes it the hound in the sky.

## Operating Context

- **Local only.** No public deploy. Showcasing happens from the owner's machine: live demo, screen share, screenshots or recordings. (`vercel.json` is leftover scaffolding, not a deploy target.)
- **Scanner backend:** Python stdlib server at `E:\ataspace\WhaleHunterAlt\scanner\server.py` on `http://127.0.0.1:8000`. It polls every 300 s and stores samples in SQLite. The app reaches it as `/api` through the Vite dev proxy. `docs/redesign/RUNBOOK.md` has the start commands.
- **Scanner off:** the app falls back to a static sample, and the sample is visibly labelled SAMPLE.
- **Demo gate (planned):** an optional sessionStorage login gate behind `VITE_DEMO_GATE`, off by default. It is explicitly not real security.
- Phase 0: scanner + alerts + paper trades only.

## Capabilities and Constraints

Phase 0 of the HedgeHound redesign (PLAN.md section 1 and 4.4). The site is a front end for the local scanner.

- **Paper only.** No order placement, no exchange keys, no order code. Phase 0 never gets any. Trade decisions stay manual.
- **Local scanner.** Python scanner at `http://127.0.0.1:8000` (`GET /api/scan`, 300 s polls). The app reaches it through the dev proxy at `/api` (`vite.config.ts`), so the browser never calls port 8000 directly.
- **Data not yet available.** Per-venue hourly rates, 24 h volume and open interest, and history for trails (`/api/history`) need owner approval and a scanner change (PLAN section 1, T41). Until then those figures show SAMPLE or are hidden.
- **Source labels.** Every on-screen number carries a source tag: **LIVE** (from `/api/scan`), **PAPER** (the local paper book, kept in the browser), or **SAMPLE** (static layout sample, or the fallback when the scanner is off). A number without a tag is a bug.
- **Works with the scanner off.** Scanner down means a clearly labelled SAMPLE state, not an error page.
- **Rendering.** TanStack Start with server-rendered text (the mega title is the LCP element). One persistent WebGL canvas (`SkyStage`) mounted once in the root layout, with section 3D drawn through drei `View`. No `window`, `document`, three or GSAP at module top level.
- **Motion.** GSAP owns scroll-linked motion; `motion` owns micro-interactions. `prefers-reduced-motion: reduce` shows a static sky with no scrubbed motion and no boot sequence.
- **Devices.** 390x844 phone width with no horizontal scroll. Quality tiers (high, mid, low) reduce 3D cost on weaker devices.
- **Scope.** Local only. The demo gate is off by default and is not security.

## Brand Commitments

Name: Hedge Hound. Evokes the delta-neutral hedge and sniffing out opportunities. Visual identity follows PLAN section 2 of the redesign (`docs/redesign/PLAN.md`):

- **Concept (PLAN 2.1):** a 17th-century star atlas that is also a live radar. Engraved constellations on parchment, with a scanner beam sweeping across them.
- **Stars are real coins (PLAN 2.1):** brightness comes from live net APR, twinkle steadiness from persistence. Home position is Sirius, RA 06h 45m 09s, DEC -16 deg 43 min.
- **Palette (PLAN 2.2):** dark constellation tokens (`--void`, `--night`, `--starlight`, `--nebula-1`, `--nebula-2`). `--scent` is alert and the short leg, `--scan` is the scanner and the long leg, `--parchment` is the star-chart sheet. The ember-brown palette is retired.
- **Type roles (PLAN 2.3):** Bricolage Grotesque for mega chapter titles, Fraunces italic for subtitles with a Pinyon Script swash initial, Syne only for the wordmark, JetBrains Mono for data, HUD, and labels.
- **Local fonts (PLAN 2.3):** all faces load from `@fontsource` packages, not a Google CDN at runtime. Body text is Fraunces roman 400.

## Evidence on Hand

- **Live data:** scanner `GET /api/scan`. It returns rows (symbol, gross/net APR, persistence, direction, n24, flip hours, status) plus `meta` filter lists.
- **Measured findings:** `E:\ataspace\WhaleHunterAlt\docs\FINDINGS.md` (verified API schema, rate units, filters). Strategy, risk rules and the paper-trading spec are in `E:\ataspace\WhaleHunterAlt\docs\01–05`.
- **Sample field:** `src/lib/scent.ts`, a static layout of 24 coins. Its figures are SAMPLE, not measurements.
- **Existing copy worth reusing:** `src/components/hero-film.tsx` and `src/components/den-desk.tsx`.
- **Absent:** there are no testimonials, users, benchmarks, track record or realised returns. None may be invented, including for the showcase.

## Product Principles

1. Measured numbers only — label every figure live, paper, or sample.
2. The human decides — the tool sniffs, the operator acts.
3. Local-first and dependency-lean — runs on the owner's PC with nothing to provision.
4. Honesty over hype — paper stage stays visibly paper until Phase 1 criteria pass.

## Accessibility & Inclusion

- WCAG 2.2 AA is the floor, covering contrast on dark, glass and parchment surfaces, full keyboard operation and visible focus.
- Animated text (SplitText, ScrambleText decode) must expose its real text to screen readers.
- `prefers-reduced-motion: reduce` gives a static, fully readable Edition: no scrubbed motion and no boot sequence.
