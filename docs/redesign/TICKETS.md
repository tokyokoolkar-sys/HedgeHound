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

---

## P1 — Spikes (timebox 45–60 min each; output = `docs/redesign/spikes/<ID>.md` with a decision + snippet)

### S1 [S] One persistent canvas + drei View under TanStack Start SSR
- Mount a `<ClientOnly>` `SkyStage` in `__root.tsx` (fixed, inset 0, z 0, `eventSource={document.body}`, `<View.Port/>`). Render 1 full-screen background view + 2 `<View track={ref}>` boxes in a test route. Navigate between routes: the canvas must **not** remount (log the mount count).
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
- **Answer:** final `smooth-scroll.tsx` + `gsap.client.ts` snippets; any jank sources.

---

## P2 — Foundation [O] (Opus builds; nobody else edits these files)
- **T10** tokens + type scale + `.parchment`, `.glass`, `.hud` utilities in `styles.css`; `lib/palette.ts` mirror; map shadcn/magicui CSS vars to tokens. → Impeccable critique on `/_kitchen`.
- **T11** `lib/motion/*`: client-only GSAP registration (ScrollTrigger, SplitText, ScrambleText, DrawSVG), `SmoothScroll` provider, `useReducedMotion`, quality tier detection → store.
- **T12** `components/stage/*` + `lib/stage/*`: store, waypoints for all 10 chapters + sky/den modes, SkyStage, Starfield (instanced, `uScanY` flare), Constellation (from adapter), Nebula (per S2), CameraRig, ScanSweep, Effects, Dust.
- **T13** `components/edition/*` primitives (Chapter, Plate, Sheet, TornEdge, MegaTitle, SwashHeading, ChapterIndex, Hud, SourceTag, GlassPanel, FeatureTable, ScanLine); `content/edition.ts`; **stub files for all 10 chapters** (title + swash only) wired into `routes/index.tsx`; new `nav/site-nav.tsx` shell.
- **T14** Overture + BootSequence + hound-mark (S4) + glass Edition card.
- **T15** Sniff chapter + `objects/radar.tsx` = **reference implementation**. → Impeccable full critique; fold the fixes into the primitives; tag `foundation-v1`.

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
- Impeccable critique + polish across the Edition; side-by-side with the Shopify reference frames; perf profile per tier; a11y (headings order, focus visible, SplitText aria, contrast on parchment and glass); honesty sweep (every number tagged). Optional: Emil Kowalski `review-animations`.

---

## Status
| ID | Owner | Status | Notes |
|---|---|---|---|
| T00 | H | done | npm run dev boots on Windows via package.json; RUNBOOK; wrapper unchanged (notes/T00.md) |
| T00b | H | partial | PRODUCT.md done; Impeccable c63b8dd installed as markdown only (no scripts/hooks); teach/init needs interactive session; skill-listed check pending a fresh session; see notes/T00b.md |
| T01 | H | done | /api proxy to :8000; :8080/api/scan matches :8000 (notes/T01.md) |
| T02 | H | done | 12 packages added, typecheck ok, no peer errors (notes/T02.md) |
| T03 | H | blocked | shadcn init: npm EALLOWSCRIPTS on npm install step; see notes/T03.md |
| T04 | H | partial | 3 font imports verified in browser; /_kitchen display waits on blocked T03 (notes/T04.md) |
| S1–S5 | S | todo | |
| T10–T15 | O | todo | |
| T20–T27 | S | todo | |
| T30–T35 | S/H | todo | |
| T40 | S | todo | |
| T41 | S | blocked: owner OK | |
| T50–T51 | H | todo | |
| T52 | O | todo | |
