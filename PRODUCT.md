# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

TanStack Start + React 19 + Vite + Tailwind v4 + R3F + GSAP

## Users

Solo operator (the owner) running everything on a local Windows PC. Job: monitor Lighter × Binance funding-rate spreads, review alerts and paper results, and manually decide whether any hedged trade is worth placing. No other audience confirmed.

## Product Purpose

Hedge Hound is the web interface for the local funding-spread scanner: a hero/overview surface, a live scanner view over the Python backend, and sketch pages for the playbook and future work. It exists so the operator can see spreads, persistence, and paper-trade state at a glance. Success means the operator can judge opportunities in seconds without touching a terminal. It never places trades.

## Positioning

A delta-neutral funding-spread tool that shows its own workings: live local measurements, honestly labeled paper stage, no invented yields. The "hound" motif (sniffing out spreads, guarding the hedge) is the owner's chosen identity.

## Operating Context

Local-first: Python scanner on http://localhost:8000 (`/api/scan`), SQLite samples, 300s polls. The web app reads that API with an offline fallback. A simple login gate (demo password) fronts the app because it runs on a personal machine; it is explicitly not real security. Phase 0: scanner + alerts + paper trades only.

## Capabilities and Constraints

- This round: hero section (full build) + 2 sketch pages + simple login page.
- Confirmed hero ingredients: perspective scroll as the main hero animation; text animations (blur reveal, gradient wave); a symbols carousel showing live symbols with prices/APRs in percent (from `/api/scan`, never fabricated); smooth dropdown where it fits (optional).
- No order placement code, no keys, no new backend dependencies. No invented APRs, testimonials, or performance claims — every number on screen traces to the API or is labeled sample/fallback.
- Open decisions: deploy target (assumed local `vite dev` / static preview until stated); whether the scanner backend will also serve the built frontend.

## Brand Commitments

Name: Hedge Hound. Evokes the delta-neutral hedge and sniffing out opportunities. Visual identity follows PLAN section 2 of the redesign (`docs/redesign/PLAN.md`):

- **Concept (PLAN 2.1):** a 17th-century star atlas that is also a live radar. Engraved constellations on parchment, with a scanner beam sweeping across them.
- **Stars are real coins (PLAN 2.1):** brightness comes from live net APR, twinkle steadiness from persistence. Home position is Sirius, RA 06h 45m 09s, DEC -16 deg 43 min.
- **Palette (PLAN 2.2):** dark constellation tokens (`--void`, `--night`, `--starlight`, `--nebula-1`, `--nebula-2`). `--scent` is alert and the short leg, `--scan` is the scanner and the long leg, `--parchment` is the star-chart sheet. The ember-brown palette is retired.
- **Type roles (PLAN 2.3):** Bricolage Grotesque for mega chapter titles, Fraunces italic for subtitles with a Pinyon Script swash initial, Syne only for the wordmark, JetBrains Mono for data, HUD, and labels.
- **Local fonts (PLAN 2.3):** all faces load from `@fontsource` packages, not a Google CDN at runtime. Body text is Fraunces roman 400.

## Evidence on Hand

- Live data: scanner `GET /api/scan` (rows: symbol, gross/net APR, persistence, direction).
- Measured findings: `docs/FINDINGS.md` (verified API schema, rate units, filters).
- No marketing copy, testimonials, or benchmarks exist and none may be invented.

## Product Principles

1. Measured numbers only — label every figure live, paper, or sample.
2. The human decides — the tool sniffs, the operator acts.
3. Local-first and dependency-lean — runs on the owner's PC with nothing to provision.
4. Honesty over hype — paper stage stays visibly paper until Phase 1 criteria pass.
