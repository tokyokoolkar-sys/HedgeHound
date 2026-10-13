# HedgeHound redesign — tickets

Read `docs/redesign/PLAN.md` first (sections 2–4 are binding). Every ticket also obeys the **Definition of Done** in PLAN §6.
Owner tags: **[H]** Haiku · **[S]** Sonnet · **[O]** Opus.
When you finish a ticket, write `docs/redesign/notes/<ID>.md`: what changed, files touched, screenshots, open issues. Then tick it in the status table at the bottom.

Working style for builders:
- One ticket per git branch / worktree: `git worktree add ../hh-<ID> -b <ID>`.
- Touch only the files your ticket lists. If you need a shared file changed (store, tokens, primitives), write the request in your notes. Don't edit it.
- Copy patterns from the reference implementation (`chapters/02-sniff.tsx`, `objects/radar.tsx`) once T15 has landed.

---

## P0 — Groundwork

### T00 [H] Baseline + de-Grok agent files
- `git init`; add `.gitignore` (node_modules, .tanstack, dist, .output, .vercel, screenshots/*.png, *.log); commit "baseline: grok build".
- Move `AGENTS.md` → `.grok/AGENTS.grok.md` (it's Grok's sandbox contract and misleads other agents). Commit.
- Run `npm install` then `npm run dev`. Confirm http://localhost:8080 renders `/`, `/universe`, `/den`. If `scripts/with-app-env.mjs` fails on Windows, record the exact error in notes and stop.
- In a second terminal: `python E:\ataspace\WhaleHunterAlt\scanner\server.py` → confirm http://localhost:8000/api/scan returns JSON.
- Write `docs/redesign/RUNBOOK.md`: the exact commands to start both, ports, how to tell LIVE vs SAMPLE.
- **Accept:** clean git history with 2 commits; RUNBOOK exists; both servers verified.

### T00b [H] Install Impeccable + product context
- Install the Impeccable skill into this repo for Claude Code (same method used for WhaleHunterAlt; repo `pbakaus/impeccable`).
- Copy `E:\ataspace\WhaleHunterAlt\PRODUCT.md` → `./PRODUCT.md`. Edit: Stack = "TanStack Start + React 19 + Vite + Tailwind v4 + R3F + GSAP"; Brand Commitments = PLAN §2.1–2.3 in 5 bullets. Keep Product Principles **verbatim**.
- Run Impeccable's teach/context step, feeding it PLAN §2.
- **Accept:** skill listed in Claude Code; PRODUCT.md committed.

### T01 [H] API proxy
- `vite.config.ts` → add `server: { proxy: { "/api": "http://127.0.0.1:8000" } }` inside `defineConfig` (merge with any existing `server` key; don't touch the Grok plugins).
- **Accept:** with both servers up, http://localhost:8080/api/scan returns the same JSON as :8000.

### T02 [H] Dependencies
```
npm i @react-three/drei @react-three/postprocessing postprocessing lenis motion @shadergradient/react three-stdlib camera-controls @paper-design/shaders-react
npm i @fontsource-variable/bricolage-grotesque @fontsource-variable/jetbrains-mono @fontsource/pinyon-script
```
- If a package fails peer resolution with React 19 / three 0.186, record the error; **don't** use `--force` without noting it.
- **Accept:** `npm run typecheck` passes; `npm run dev` still boots.

### T03 [H] shadcn + magicui
- `npx shadcn@latest init`: Radix base (Radix is already installed), CSS file `src/styles.css`, alias `@/components`, utils at `@/lib/cn` (already exists; point `utils` alias there rather than creating `lib/utils.ts`).
- `npx shadcn@latest add button card table tabs tooltip hover-card slider sheet dialog command badge scroll-area separator sonner toggle-group`
- magicui (registry via shadcn CLI; if the `@magicui/` namespace isn't recognised, use the `https://magicui.design/r/<name>.json` URL form): `number-ticker border-beam marquee animated-beam orbiting-circles hyper-text ripple meteors`. Move them into `src/components/magicui/`.
- Don't restyle anything yet; T10 maps tokens.
- **Accept:** all components compile; one throwaway route `/_kitchen` renders each (delete in T52).

### T04 [H] Fonts
- Import in `src/styles.css`: bricolage-grotesque (wght), jetbrains-mono (wght), pinyon-script (400). Keep Syne + Fraunces.
- **Accept:** fonts visible in `/_kitchen`; no FOUT warnings in the console.

### T03b [H] Text effects (after T03)
- Files: `src/components/text-fx/*`, `src/routes/[_]kitchen.tsx`.
- Port from `E:\ataspace\WhaleHunterAlt\web\src\components\` (read only): `blur-reveal.tsx`, `gradient-wave-text.tsx` (+ its `.gradient-wave-text` / `@keyframes gradient-wave` CSS from WhaleHunterAlt `index.css` → `text-fx/gradient-wave-text.css`, imported by the component; **don't** touch `styles.css`), `perspective-text-scroll.tsx`. Swap `@/lib/utils` → `@/lib/cn`.
- Add magicui `animated-shiny-text` (shimmer) into `src/components/text-fx/`.
- Gradient wave colours: starlight/dim tones only, never `--scent`/`--scan` (PLAN §2.2). Respect `prefers-reduced-motion` (static text).
- `perspective-text-scroll` keeps its own scroll listener for now; T11/T13 move it onto GSAP ScrollTrigger (rule 4). Note this in the file header.
- BlurReveal is for sheet cards only, never on elements a chapter's GSAP timeline animates.
- **Accept:** each effect demoed on `/_kitchen`; SSR-safe; typecheck + lint pass.

---

## P1 — Spikes (timebox 45–60 min each; output = `docs/redesign/spikes/<ID>.md` with a decision + snippet)

### S1 [S] One persistent canvas + drei View under TanStack Start SSR
- Mount a `<ClientOnly>` `SkyStage` in `__root.tsx` (fixed, inset 0, z 0, `eventSource={document.body}`, `<View.Port/>`). Render 1 full-screen background view + 2 `<View ref className>` boxes (S1: `track={ref}` is ignored in drei 10.7.9) in a test route. Navigate between routes: the canvas must **not** remount (log the mount count).
- **Answer:** hydration warnings? remount? pointer events through DOM?

### S2 [S] Nebula: ShaderGradient vs custom shader
- Try (a) `<ShaderGradient>` inside the SkyStage canvas, (b) `ShaderGradientCanvas` as its own canvas at `pixelDensity 0.5`, (c) a 60-line custom fbm nebula fragment shader on a full-screen plane inside SkyStage. Measure fps (high-end + throttled 4× CPU in DevTools).
- **Answer:** pick one; give the colour settings matching `--nebula-1/2`.

### S3 [S] Liquid glass
- (a) Load `liquid-glass-js` over the live SkyStage. Does html2canvas capture the WebGL sky? (expected: no, or stale). (b) Build `GlassPanel` per PLAN §4.3 (CSS backdrop + SVG displacement) and compare. (c) drei `MeshTransmissionMaterial` on a rounded box inside SkyStage: cost on mid tier.
- **Answer:** confirm DOM = GlassPanel, 3D = transmission (high) / metal (mid/low). Port the rim/edge highlight formula from liquid-glass-js into GlassPanel CSS and record the values.

### S4 [S] Liquid-metal hound mark
- Make `public/hound-mark.svg` (from `favicon.svg`, simplified silhouette). Try `@paper-design/shaders-react` `LiquidMetal` with it. If that API isn't there, port the shader from `github.com/paper-design/liquid-logo` (check its LICENSE first; note it).
- **Answer:** working component, its own canvas or not, cost, and how it unmounts when off-screen.

### S5 [S] Scroll stack
- Lenis (driven by `gsap.ticker`, `lagSmoothing(0)`) + ScrollTrigger + CSS sticky plates + a scrubbed SplitText title + store writes read in `useFrame`. Test Chrome, Firefox, and iOS Safari if available (or Chrome mobile emulation). Use `ScrollTrigger.config({ ignoreMobileResize: true })` and `svh`.
- **Answer:** final `smooth-scroll.tsx` + `gsap-browser.ts` snippets (no `*.client.*` names, S5); any jank sources.

---

## P2 — Foundation [O] (Opus builds; nobody else edits these files)
> **Rescoped 2026-10-13 for the Almagest direction (D1).** Build to `DESIGN.md` (read "The owner's taste" first). Port proven code from branch `D1-almagest` (`src/components/spike-almagest/*`) rather than rewriting it from scratch. The earlier T10 branch (`T10`, parchment/glass tokens) is superseded: keep only its plumbing (lockstep test, shadcn mapping approach, `text-muted` → `text-dim`, Fraunces/Inter removal), redo the values.
- **T10** tokens + type to `DESIGN.md`:
  - `@theme` colours: void, starlight (+ dim/faint), chart line, scan cyan, scent orange, star tints
  - Noto Serif Display + JetBrains Mono via `@fontsource`; retire Bricolage, Fraunces, Pinyon and Syne
  - type scale: hero / chapter / title / subtitle / body / label / figure
  - `palette.ts` mirror + lockstep test
  - shadcn mapping: primary = starlight, CTA variant = scent, ring = scan
  - no `.parchment`, `.glass` or `.sky-floor`
  - Impeccable critique on `/_kitchen`; critique answers from 2026-10-12 still apply (orange = alerts only, 11px HUD minimum)
- **T11** `lib/motion/*`:
  - Lenis on `gsap.ticker` (S5 settings, `lenis.reset()` before destroy)
  - section progress from offsets + `ResizeObserver` (fixed-stage model, PLAN §4.1.5)
  - `useReducedMotion`, quality tier → store
  - no ScrollTrigger timelines on copy
- **T12** `components/stage/*` + `lib/stage/*`:
  - store and waypoints for overture + α–κ + sky/den modes
  - SkyStage: one canvas; post = CrawlEffect + Noise + Vignette, **no Bloom**; shader output linearized
  - Starfield (shell + flight + dust, wrap and fade), CameraRig (pointer parallax)
  - `objects/canis-major.tsx` (J2000, Bayer labels via static `<Html>`), `objects/glass-hound.tsx` (custom glass shader, exponential recede)
  - ported from D1
- **T13** `components/edition/*` primitives:
  - Chapter (fixed-stage), ChapterIndex (α–κ), Hud, SourceTag (exists)
  - ShimmerTitle (`@spell/shimmer-text`), Rise, Stardust, ProjectedLabel (DOM projected per frame, never `<Html>` for refreshing data), bite-mask
  - `@spell/logos-carousel` (with the `<style>` fix)
  - `content/edition.ts`; **stub files for all chapters** (overture + α–κ) wired into `routes/index.tsx`; `nav/site-nav.tsx` shell (no glass pill: wordmark + links on the sky)
- **T14** Overture + α Canis Major:
  - glass hound → constellation burst → copy rising with the scroll
  - the α→β bite crawl with the symbol carousel (net APR, tagged, featured coin excluded)
- **T15** β Sniff chapter + `objects/radar.tsx` (sweep, pings, projected coin labels, the reading with leader line + Stardust) = **reference implementation**. → Impeccable full critique; fold the fixes into the primitives; tag `foundation-v1`.

---

## P3 — Chapters [S] (start from tag `foundation-v1`; each one touches only its listed files)
Common inputs: `content/edition.ts` entry (copy), waypoint id (already exists), `useScan()` for data, `SourceTag` on every figure. Before handing in, run Impeccable's audit on your chapter and fix what it finds within your files.

### T20 III Spread
- Files: `chapters/03-spread.tsx`, `objects/hedge-astrolabe.tsx`.
- Astrolabe: coin core (beveled cylinder, metal; transmission on high), ring A (`--scan`, long) and ring B (`--scent`, short) counter-rotating; 48 instanced tick marks. Scroll 0.2→0.7: rings slide apart ±1.4 units on x, drei `Html` labels "LONG · {venue}" / "SHORT · {venue}" from the live top row's `long/short`.
- Sheet: magicui AnimatedBeam (Lighter ⇄ coin ⇄ Binance), the 4 CARDS (copy from old `hero-film.tsx`), a live "loudest clean scent" card (top `status==="ok"` row, NumberTicker on net APR).
- **Accept:** rings separate smoothly at 60fps high; labels match live data; SAMPLE tag when offline.

### T21 IV Trail
- Files: `chapters/04-trail.tsx`, `objects/comet-trail.tsx`.
- Comet: the focus coin moves along a short arc; trail = drei `Line` whose points come from history (T41), colour flips at sign changes. Without T41: draw from `trailFor()` **with a SAMPLE tag on the plate**.
- Sheet: 6 small-multiple sparklines (recharts or a 40-line SVG), top 6 by persistence; mono labels `persist 0.97 · flip 28.4h · window 23.8h`.

### T22 V Hedge
- Files: `chapters/05-hedge.tsx`. Waypoint `hedge` lights the Hedge sector.
- Sheet (glass tone): live cards for `sector==="hedge"` or all `status==="ok"` rows, each with BorderBeam (beam colour `--scan`, duration 6s, only the top 3), NumberTicker net APR, persistence bar, direction line "Long Binance · Short Lighter", "Open in scanner" → `/scanner?sym=`.

### T23 VI Kennel
- Files: `chapters/06-kennel.tsx`. Twinkle jitter driven by `1 - persistence` (passes through store/adapter, no new shader).
- Sheet: table (shadcn Table) of kennel coins: symbol, net APR, persistence bar, flip hours, status. Copy: why persistence has to earn the alert.

### T24 VII Embers
- Files: `chapters/07-embers.tsx`, `objects/ember-field.tsx`.
- Ember field: 200–600 instanced sparks drifting down, colour lerp `--scent`→`#5a5f70` over lifetime; the filtered coins are larger, labelled embers.
- Sheet: FeatureTable of risk rules (PLAN §3 row VII) + three live lists from `meta.skipped_zero/young/thin` with reason copy (reuse the `filterReason` strings from `scent.ts`).

### T25 VIII Sky portal
- Files: `chapters/08-sky.tsx`. Plate: the camera pulls back to the full atlas (waypoint `sky-overview`). CTA "Enter the sky" → animate the store to the `sky` waypoint over 1.1s (GSAP), then `navigate({ to: "/sky" })`. **No canvas remount** (S1).
- Reduced motion: plain link.

### T26 IX Den teaser
- Files: `chapters/09-den.tsx`, `objects/desk-orb.tsx` (small glass orb holding a pocket sky).
- Sheet: 3 stat tiles from the paper book (localStorage `hedgehound.book` via existing den logic, tag PAPER), a static preview of "A year of what-ifs" → `/den`.

### T27 X Ledger
- Files: `chapters/10-ledger.tsx`. Stars fade except Sirius. Footer: data source status (LIVE/SAMPLE, last ts, scanner URL), "Phase 0 · paper only" badge, disclaimer "Not financial advice. No order code exists in Phase 0.", route links, ©.

---

## P4 — Pages

### T30 [S] Nav
- Files: `components/nav/*`. Glass pill (GlassPanel). Wordmark (Syne) left; "Editions ▾" = port of WhaleHunterAlt `hound-menu.tsx` (swap hugeicons → lucide, react-router → TanStack `Link`/`useNavigate`); ⌘K `coin-command.tsx` (shadcn Command over live symbols → `/sky?star=`); right: `poll-status.tsx` (`● LIVE · next 04:12` / `○ SAMPLE · start scanner`) + CTA "Open scanner".
- Mobile: wordmark + menu button → shadcn Sheet.

### T31 [S] /scanner (port)
- Files: `routes/scanner.tsx`, `components/scanner/*`. Port `WhaleHunterAlt/web/src/pages/Scanner.tsx` onto shadcn Table + `@tanstack/react-table`: sortable columns (symbol, net, gross, persistence, n24, flip h, status, long/short, liq dist), filter chips (status ok / building / stale), min-net slider (shadcn Slider → query param), row click → `/sky?star=`. Glass sheet on top of SkyStage `mode: "quiet"` (dim sky).
- Supports `?sym=` highlight.

### T32 [H] /playbook (port)
- Files: `routes/playbook.tsx`. Port `pages/Playbook.tsx` content into parchment Sheets with SwashHeading + FeatureTable. Pure content; no new animation beyond the primitives.

### T33 [S] /sky on SkyStage
- Files: `routes/sky.tsx`, `routes/universe.tsx` (→ redirect `/sky` keeping `?star`), `components/universe-view.tsx`. Remove its own `<Canvas>`; drive SkyStage `mode: "sky"` + `focus`. Keep the sidebar (restyle: glass, mono, sector headings in Fraunces italic) and the detail card. Delete `three/universe-scene.tsx` once parity is confirmed.

### T34 [S] /den restyle
- Files: `components/den-desk.tsx`, `routes/den.tsx`. Tokens/type only + GlassPanel cards + NumberTicker; MiniSky uses a drei View instead of its own canvas. Don't change `lib/monte.ts` logic.

### T35 [H] Demo gate (optional, flag `VITE_DEMO_GATE=true`)
- Files: `routes/login.tsx`, a `beforeLoad` check in `__root.tsx`. Port `pages/Login.tsx` (sessionStorage `hh_auth`). Off by default. Label "Local demo gate, not security".

---

## P5 — Data

### T40 [S] Live data layer (can start right after P0)
- Files: `lib/scan/*`, `lib/scent.ts` (split: `LAYOUT` map vs `SAMPLE` rows), `__root.tsx` (QueryClientProvider if missing).
- Port `api.ts`; `use-scan.ts` with TanStack Query (30s); `adapter.ts` `toStars()` per PLAN §4.4; unit test for the adapter with a recorded `/api/scan` JSON fixture (save a real response to `src/lib/scan/__fixtures__/scan.json`).
- Grep and fix every place showing `scent.ts` figures without a SAMPLE tag.

### T40b [S] Data-honesty cleanup (owner-approved 2026-10-12)
- Files: `lib/scan/*`, `components/hero-film.tsx`, `components/den-desk.tsx`.
- `cost` joins the scan query (`/api/scan?cost=`) and the query key, defaulting to `DEFAULT_BOOK` cost (0.30), so live and sample nets use the same cost.
- Copy: the hero ARB "83% APR" is read from the sample row, not hard-coded. Reword "What the hound brought back" and "A few dollars a year if the edge is real" so neither reads as a result or yield claim. CSV filename `hedgehound-paper.csv` → `hedgehound-sample.csv`.
- Offline backoff: while the fallback is showing, refetch at 30 s → 2 min → 5 min (cap); go back to 30 s on the first live answer. No 502 spam in the console with the scanner off.
- Stale: `useScan` exposes `stale` (live `ts` older than 300 s, client clock only). Pass it to `<SourceTag stale>` wherever a LIVE tag is rendered.
- **Accept:** typecheck/lint/test green; scanner on → LIVE; scanner off → SAMPLE with at most one network error per backoff step; adapter tests extended for cost.

### T41 [S] Scanner endpoints (**only after the owner says yes**; edits `E:\ataspace\WhaleHunterAlt\scanner\server.py`)
- Stdlib only, read-only, no schema changes. Add `GET /api/history?sym=ARB&hours=24` → `[{ts, l, b, spread_apr}]` from the `s` table. Add `lighter_hr, binance_hr` (latest) to scan rows; return the per-venue vol/OI the server already computes, if available in `state`.
- Bump nothing else. Record a new fixture. Update `docs/FINDINGS.md` with the new fields.

---

## P6 — QA & polish

### T50 [H] Screenshot + console harness
- `scripts/shoot.mjs` (Playwright, Chromium at `/opt/pw-browsers` not needed locally; use the installed one): for each route and each chapter anchor (`/#sniff`, …) capture 1440×900 and 390×844, once normal and once with `reducedMotion: "reduce"`; wait 1.5 s after scroll; collect console errors → `screenshots/report.json`. Fail if any error.
- Run it on demand; attach the output path in notes.

### T51 [H] Hygiene pass
- typecheck, lint, prettier; remove dead files (`hero-film.tsx`, `tear.tsx`, old three scenes) only after their replacements are merged; delete `/_kitchen`.

### T52 [O] Review & polish
- Impeccable critique + polish across the Edition; side-by-side with the Shopify reference frames; perf profile per tier; a11y (headings order, focus visible, SplitText aria, contrast on parchment and glass); honesty sweep (every number tagged); **real iPhone Safari check** of the scroll stack (S5 only had emulation). Optional: Emil Kowalski `review-animations`.

---

## Status
| ID | Owner | Status | Notes |
|---|---|---|---|
| T00 | H | done | npm run dev boots on Windows via package.json; RUNBOOK; wrapper unchanged (notes/T00.md) |
| T00b | H | done | PRODUCT.md refreshed via /impeccable init; Impeccable c63b8dd + launcher + design hook (quiet) installed; see notes/T00b.md |
| T01 | H | done | /api proxy to :8000; :8080/api/scan matches :8000 (notes/T01.md) |
| T02 | H | done | 12 packages added, typecheck ok, no peer errors (notes/T02.md) |
| T03 | H | done | shadcn 4.21.4 vega via local binary; 15 shadcn + 8 magicui on /_kitchen; cn declined; lint: pre-existing error + 4 warnings (notes/T03.md) |
| T03b | H | done | 4 text effects ported to text-fx and demoed on /_kitchen; perspective scroll not visually verified (hidden pane) (notes/T03b.md) |
| T04 | H | done | font faces verified on /_kitchen; lint issues from untracked Impeccable scripts (notes/T04.md) |
| S1–S5 | S | done | S2/S3/S4 outcomes superseded by D1 (no nebula, no glass cards, custom glass hound) |
| D1 | O | done | Almagest direction prototype: `/_almagest` on branch `D1-almagest`; written up as `DESIGN.md` |
| T10 | O | done | DESIGN.md tokens + type; two fonts; legacy palette kept (1b); critique 19/28; notes/T10.md |
| T11–T15 | O | todo | rescoped to DESIGN.md (Almagest, D1) |
| T20–T27 | S | todo | |
| T30–T35 | S/H | todo | |
| T40b | S | done | cost in query+key (0.30); copy fixes (ARB card from sample row, den H1, hub line, CSV name); 30 s/2 min/5 min offline backoff; useScan().stale (no LIVE tag exists yet to receive it); 289 tests; branch T40b (notes/T40b.md) |
| T40 | S | done | scan layer (types/api/use-scan/adapter/sample), scent.ts split, QueryClientProvider, adapter test (+21), SAMPLE tags on den/home/sky; branch T40 (notes/T40.md) |
| T41 | S | blocked: owner OK | |
| T50–T51 | H | todo | |
| T52 | O | todo | |
