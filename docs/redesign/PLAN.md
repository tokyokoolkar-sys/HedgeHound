# HedgeHound — "The Canis Edition" redesign plan

Owner: Opus (lead) · Builders: Sonnet · Chores/QA: Haiku
Repo: `E:\ataspace\BuiltwGrok\HedgeHound` (this folder) · Backend: `E:\ataspace\WhaleHunterAlt\scanner\server.py` (stays where it is)
Tickets: `docs/redesign/TICKETS.md` · Agent rules: `CLAUDE.md`

---

## 0. TL;DR

Rebuild HedgeHound's front end as a long-scroll **"Edition"** in the style of Shopify Editions (Renaissance, Winter '26), using a **dark constellation** theme in place of the paintings:

| Shopify Editions does… | HedgeHound does… |
|---|---|
| Renaissance paintings as full-bleed "plates" | One **persistent 3D night sky** (single R3F canvas). The camera *travels* between constellations, one per chapter |
| Cream paper content sheets with torn edges | **Star-chart parchment** sheets (celestial-atlas engraving look) plus **liquid-glass** sheets for live data |
| Floating 3D products (POS hub, Sidekick sphere) | Floating 3D **instruments**: Hedge Astrolabe (two-leg rings), Radar dish, the Hound constellation, Ember field |
| Left index rail with roman numerals | Same rail, I–X. Each item is a star that lights when active |
| Neo-grotesk mega titles + swash serif subtitles | Bricolage Grotesque mega titles + Fraunces italic with a **Pinyon Script swash initial** |
| "Ren///ssance" glitch wordmark | "Can✶s Edition". The star replaces the dot of the i |
| — (our twist) | **Scanning everywhere**: radar sweeps, scan-lines that flare the stars they cross, a HUD with RA/DEC coordinates, a live poll countdown, and text that decodes in like a readout |

WhaleHunterAlt/web is **not** extended. Its live-data layer and the components worth keeping are **ported into HedgeHound**. WhaleHunterAlt keeps running the Python scanner and becomes an archive for the web part.

---

## 1. What exists today (audit, 2026-10-12)

### HedgeHound (target)
- **Stack:** TanStack Start (SSR) + Vite 8 + React 19 + Tailwind v4 + TS. Scaffolding from the Grok sandbox: better-auth (off via `.grok/app-env.json` → `VITE_AUTH_ENABLED=false`), PGlite, PWA plugin, preview bridge. `npm run dev` → `0.0.0.0:8080` via `scripts/with-app-env.mjs`.
- **Already installed:** `three@0.186`, `@react-three/fiber@9`, `gsap@3.15` (all bonus plugins ship in the package: SplitText, ScrambleText, DrawSVG, MorphSVG, ScrollSmoother), `recharts`, `zustand`, `@tanstack/react-query`, `@tanstack/react-table`, most Radix primitives, `cmdk`, `vaul`, `sonner`, Syne + Fraunces fonts.
- **Routes:** `/` (`hero-film.tsx`, 400 lines: open → paper "Why the hedge holds" → "Names, drifting" → "One coin. Two legs."), `/universe` (`universe-view.tsx` + `three/universe-scene.tsx`: constellation sky with a sidebar), `/den` (`den-desk.tsx`, 568 lines: board, pocket sky, paper book, Monte Carlo "year of what-ifs").
- **Data:** `src/lib/scent.ts` is a **static field sample** (24 stars with sectors canis/hedge/kennel/embers, 3D positions, blurbs, links). `trailFor()` synthesizes sparkline trails. **Nothing is live.**
- **3D:** three separate `<Canvas>`es (sniff, hub, universe), each lazy-loaded. No drei, no postprocessing.
- **Look:** orange-ember on brown-black, a zigzag `Tear`, Syne Extrabold. It's competent but flat. There's no depth layering, no persistent world, and the chapters feel like a template.
- **Hazard:** `AGENTS.md` at the root is **Grok's sandbox contract** ("You are Grok Build… /workspace… port 8080"). Claude Code and other agents will read it and get confused, so move it (T00).
- **Not a git repo.** Fix before any agent touches it (T00).

### WhaleHunterAlt (source to port from, then archive)
- `scanner/server.py`: stdlib Python, `127.0.0.1:8000`, `GET /api/scan?min&hold&cost&lev` → `{rows[], err, ts, meta{divisor, assumed8, skipped_zero, skipped_young, skipped_thin, min_vol24_usd, min_oi_usd}}`. Rows: `symbol, gross_apr, net_apr, persistence, samples, long, short, liq_dist, stale, avg_spread_hr, avg_apr_signed, hours_since_flip, window_h, n24, status`. SQLite samples, 300 s poll.
- `web/`: Vite SPA with react-router, `motion`, `@shadergradient/react`, shadcn (base-ui "base-nova"), hugeicons. Worth porting: `lib/api.ts` (fetch + **labelled** sample fallback), `pages/Scanner.tsx`, `pages/Playbook.tsx`, `pages/Login.tsx` (sessionStorage demo gate), `components/hound-menu.tsx` (smooth dropdown), `aurora-background.tsx` (ShaderGradient + pointer parallax), `blur-reveal`, `gradient-wave-text`, `symbols-ticker`, `perspective-text-scroll`.
- `PRODUCT.md`: **product principles that bind this redesign**: measured numbers only, every figure labelled live/paper/sample, the human decides, local-first, no order code, no invented yields or testimonials.

### Gap: live API vs. what the HedgeHound UI shows
| UI wants | `/api/scan` has it? |
|---|---|
| net/gross APR, direction (long/short venue), persistence, n24, flip hours, status, stale | ✅ |
| filtered "cold embers" list with reason | ✅ via `meta.skipped_zero/young/thin` (reason = which list) |
| per-venue hourly rates (Lighter hr, Binance hr) | ❌ only the spread `avg_spread_hr` |
| per-venue 24h volume / OI | ❌ (the server computes them, but doesn't return them) |
| 24h trail for sparklines | ❌ (in SQLite, no endpoint) |
| 3D position, sector, blurb | ❌ (art direction, keep in `scent.ts` as a layout map) |

→ T41 adds `/api/history` and the per-venue fields (stdlib, read-only, **needs owner OK**). Until then those UI bits show a `SAMPLE` tag or are hidden.

---

## 2. Art direction

### 2.1 Concept: "A celestial atlas that is also a radar"
Renaissance paintings ↔ **17th-century star atlases** (Bayer's *Uranometria*, Hevelius). Engraved constellation figures, parchment, copperplate lines. Canis Major *is* a hound, and its brightest star, Sirius, sits at **RA 06h 45m 09s · DEC −16° 43′**. That real coordinate becomes our home position in the HUD.
The twist is that the atlas is **alive**. A scanner beam sweeps it. Stars are real coins whose brightness comes from live net APR, and their twinkle steadiness comes from persistence.

### 2.2 Color tokens (replace the ember-brown palette)
```
--void        #04050A   page base, deepest space
--night       #070A14   plate background
--deep        #0C1224   raised dark surface
--nebula-1    #2B1F55   violet nebula wash
--nebula-2    #0B3442   teal nebula wash
--starlight   #F3EEE2   primary text on dark, star cores
--dim         #9097AC   secondary text on dark
--faint       #4A5168   tertiary / grid lines on dark
--line        rgb(243 238 226 / 0.12)
--scent       #FF6A1A   ALERT / brand accent (kept from v1 for continuity) = SHORT leg
--ember       #FFB15A   warm highlight, "building history"
--scan        #8BE9FF   scanner beam, HUD, focus rings = LONG leg
--parchment   #E9E2CF   star-chart sheet
--parchment-2 #DCD2BA   sheet shade / table stripes
--ink         #121624   text on parchment
--ink-soft    #4B5266   secondary on parchment
--rule        #C3B898   hairlines on parchment
```
Rules: `--scent` is **only** for alerts, short leg, primary CTA. `--scan` is **only** for scanning motifs, long leg, focus. Never use them decoratively.

### 2.3 Type
| Role | Face | Spec |
|---|---|---|
| Mega chapter titles ("Sniff", "The Kennel") | **Bricolage Grotesque Variable** 760–800 | `clamp(4.5rem, 13vw, 12rem)`, lh .84, tracking −.05em |
| Wordmark only | Syne 800 (existing) | brand continuity |
| Editorial / subtitles | **Fraunces Variable** italic 300–400, opsz 72+ | `clamp(1.4rem, 2.6vw, 2.4rem)`, lh 1.08 |
| Swash initial on subtitles | **Pinyon Script** | first letter 2.3em, overlaps by −.18em, color `--starlight`/`--ink` |
| Body | Fraunces roman 400, opsz 14 | 17–18px, lh 1.55, max 62ch |
| Data, HUD, labels, tables | **JetBrains Mono Variable** | tabular-nums, HUD 10.5px uppercase tracking .14em |

All fonts load through `@fontsource*` packages (local-first, no Google CDN at runtime).

### 2.4 Layout grammar (from the reference)
- **Fixed left index rail** (desktop ≥1024px): `Overture I · Sniff II · Spread III · Trail IV · Hedge V · Kennel VI · Embers VII · Sky VIII · Den IX · Ledger X`. Active item is starlight, the rest are 40% dim, and the numeral is right-aligned in mono. Clicking scrolls to the chapter. Mobile collapses it to a bottom-left "II / X" chip that opens a sheet.
- **Top nav** is a liquid-glass pill: wordmark left, "Editions ▾" (HoundMenu) + search (⌘K coin jump) center-left, poll status + "Open scanner" CTA right (= Shopify's "Start for free").
- **Content column** starts at ~28% of the viewport (the rail sits in the left gutter), max 920px. Card grids are 3-up.
- **Chapter rhythm:** Plate (sticky, 100svh, 3D + mega title + swash subtitle) → Sheet (scrolls over the plate, torn top edge, cards + feature table) → torn bottom edge → next Plate.

### 2.5 The scanning motif (our signature, used consistently)
1. **Scan-line pass**: on every chapter enter, a 1px `--scan` line with a 40px soft trail sweeps top→bottom in 0.9s. Stars within 8px of the line flare (bloom spike) as it passes. Implemented in 3D (shader uniform `uScanY`) + a DOM overlay line.
2. **Radar sweep**: a conic beam in the Sniff chapter and on the boot sequence. Coins ping (ring ripple) when the beam crosses their angle.
3. **Decode text**: HUD readouts and the index items use GSAP ScrambleText on reveal (chars `0123456789ABCDEF·`). **Never** on body copy or mega titles.
4. **HUD**: corner brackets at viewport corners. Top-left: `RA 06h 45m 09s · DEC −16° 43′` drifts with the pointer (±2° mapped). Bottom-right: `POLL #0142 · NEXT 04:12 · SRC LIVE`. It reads real `ts` from the API; the countdown is computed from 300 s.
5. **Reticle cursor** (desktop, optional): a 24px crosshair ring follows the pointer with spring lag and snaps onto stars on hover.

### 2.6 What makes it feel like *space* (depth stack, back → front)
1. Nebula wash: a custom fbm shader on a full-screen quad inside SkyStage (S2), very low contrast, slow drift. A CSS gradient floor (`.sky-floor`) covers SSR first paint, low tier and reduced motion.
2. Far stars: instanced points, ~6k (quality-tiered). Parallax 0.15× scroll and pointer.
3. Constellation stars = coins (sized by |net APR|, twinkle amplitude by 1−persistence) with lines drawn in.
4. Hero instrument (3D object of the chapter), with MeshTransmission/metal materials catching bloom.
5. Near dust: a few hundred soft sprites, parallax 1.3×, slight DOF blur.
6. DOM: mega title (scrubbed) → swash subtitle → HUD/rail/nav (fixed).
7. Post: Bloom (threshold .6, intensity .8), film grain (Noise .035), Vignette (.35). ChromaticAberration only during the scan pass.

---

## 3. Chapter map (the `/` Edition)

Copy follows `PRODUCT.md`: every number on screen is LIVE, PAPER or SAMPLE and carries a `<SourceTag>`. Copy that already exists in `hero-film.tsx` / `den-desk.tsx` is reused where it fits; it is good copy.

| # | id | Mega title | Swash subtitle | Plate (3D) | Sheet contents |
|---|---|---|---|---|---|
| I | `overture` | *(wordmark)* HedgeHound — The Can✶s Edition | "It does not chase price. It sniffs the hour." | Boot sequence → Hound constellation (Canis) assembles from coin-stars; liquid-metal hound mark; centered **glass Edition card** with the index list inside (exactly the Shopify hero card, as glass) | none (plate only), then a scroll hint |
| II | `sniff` | Sniff | "Every five minutes, the hound lifts its nose." | **Radar dish**: live coins plotted by angle = hash(symbol) and radius = f(net APR), with a sweep beam; pings on poll | 3 cards Normalize / Cancel / Doubt (existing copy); feature table "What the scanner checks" (poll 300 s, 144-sample average, 30-day listing rule, $250k vol, $50k OI, zero-rate filter) |
| III | `spread` | One coin. Two legs. | "Long the cheap hour. Short the rich one. Price cancels." | **Hedge Astrolabe**: coin core + two counter-rotating rings (scan-cyan = long, scent-orange = short); scroll separates the rings into legs labelled Lighter / Binance | AnimatedBeam diagram Lighter ⇄ coin ⇄ Binance; 4 cards (existing CARDS copy); live "loudest clean scent" card |
| IV | `trail` | The Trail | "A scent only counts if it stays." | Coin star leaves a comet trail; trail length = window_h, color flips at sign flips | Sparkline grid for the top 6 by persistence (from `/api/history` after T41, else SAMPLE); explanation of persistence and flip hours |
| V | `hedge` | The Hedge | "Where the hour actually disagrees." | Camera flies to the Hedge sector constellation | Live opportunity cards (BorderBeam "scanning" border, NumberTicker APR), sorted status ok → building; "Open in scanner" links |
| VI | `kennel` | The Kennel | "Faster funding, worse manners." | Kennel constellation: jittery twinkle, stars wobble by 1−persistence | Meme coins table with persistence bars; copy on why persistence has to earn the alert |
| VII | `embers` | Cold Embers | "Walked past on purpose." | Ember field: filtered coins as cooling sparks drifting down, color temperature orange → grey | Rules table (max 2× isolated, liquidation ≥40% away, never one naked leg, one symbol at $20, no coin younger than 30 days, stop at −25% budget) + the live skipped lists from `meta` |
| VIII | `sky` | The Sky | "Every coin, charted." | Camera pulls back to show the whole atlas; "Enter the sky" CTA **dives** the camera in and routes to `/sky` with no canvas remount | none (plate + CTA) |
| IX | `den` | The Den | "A paper desk for a $20 research budget." | Small glass desk object / pocket-sky orb | Teaser of den stats (paper book) + "A year of what-ifs" preview → `/den` |
| X | `ledger` | — | — | Stars fade, Sirius remains | Footer: data source status, phase badge "Phase 0 · paper only", disclaimer "Not financial advice. No order code exists.", links |

---

## 4. Technical architecture

### 4.1 Principles
1. **One WebGL canvas for the whole app** (`SkyStage`), mounted once in `__root.tsx`, client-only, persistent across routes. Section 3D objects render through **drei `<View>`** tracked to DOM boxes, so there's no new `<Canvas>` per section. *(S1)* The View **is** the box: `<View ref className>`. `track={ref}` is silently ignored in drei 10.7.9. DOM children of a View don't render, so overlays go in a sibling wrapper (and they block 3D pointer events where they sit). Page content sits in a `relative z-10` wrapper above the fixed z-0 canvas. **No exceptions** (decided after S2/S4): the nebula is a custom shader in SkyStage (S2), and the liquid-metal hound mark runs the `@paper-design/shaders` LiquidMetal fragment shader as a material inside SkyStage through a View (S4 option b, T14). Anything else that wants a canvas needs a new spike.
2. **SSR-safe:** everything that touches `window`/WebGL/GSAP lives behind `<ClientOnly>` or a dynamic `import()` inside `useEffect`. Text content is server-rendered (LCP = mega title, not the canvas).
3. **GSAP owns scroll** (ScrollTrigger + SplitText + ScrambleText + DrawSVG). **`motion` owns component micro-interactions** (menus, hovers, mount/unmount, magicui internals). They never animate the same element.
4. **Lenis** for smooth scroll, driven from `gsap.ticker`. `ScrollTrigger.update` runs on Lenis scroll. *(S5)* While Lenis is active, SkyStage runs `frameloop="never"` and is advanced from an `afterScroll` hook right after `lenis.raf`, so 3D and DOM agree on the same frame (otherwise 1 frame of lag); `"always"` otherwise, `"demand"` under reduced motion. Call `lenis.reset()` before `destroy()` (stale `html.lenis` class otherwise). A debounced `ResizeObserver` on `<body>` calls `ScrollTrigger.refresh()` so late fonts/content don't leave triggers stale.
5. **CSS `position: sticky`** for plates (not GSAP `pin`). Sheets scroll over them with a higher z-index. GSAP only scrubs reveals and writes progress to the store. That's cheaper and avoids pin-spacer bugs with Lenis.
6. **Zustand stage store** is the only bridge DOM → 3D. Chapters write `{chapter, progress}`, and the 3D reads it in `useFrame` via `getState()`, so 3D never re-renders React on scroll.
7. **Quality tiers** `high | mid | low` picked from drei `PerformanceMonitor` + `navigator.hardwareConcurrency` + viewport width. `prefers-reduced-motion` → static sky, no scrub, no boot sequence, instant reveals.

### 4.2 Target file tree
```
src/
  styles.css                    tokens (§2.2), type scale, .parchment, .glass, utilities
  content/edition.ts            per-chapter copy + waypoint ids (Haiku-editable)
  lib/
    palette.ts                  mirrors tokens for 3D (keep in lockstep)
    scent.ts                    → layout map (sector, pos, blurb, links) + SAMPLE data; trailFor() only for SAMPLE
    scan/types.ts api.ts use-scan.ts adapter.ts history.ts
    stage/store.ts waypoints.ts quality.ts
    motion/gsap-browser.ts smooth-scroll.tsx use-reduced-motion.ts split.ts
  components/
    ui/                         shadcn (generated)
    magicui/                    magicui (generated; restyled to tokens)
    client-only.tsx
    nav/site-nav.tsx hound-menu.tsx poll-status.tsx coin-command.tsx
    edition/chapter.tsx plate.tsx sheet.tsx torn-edge.tsx chapter-index.tsx
            swash-heading.tsx mega-title.tsx hud.tsx source-tag.tsx glass-panel.tsx
            feature-table.tsx boot-sequence.tsx scan-line.tsx
    stage/sky-stage.tsx starfield.tsx constellation.tsx nebula.tsx camera-rig.tsx
          scan-sweep.tsx effects.tsx dust.tsx
    objects/radar.tsx hedge-astrolabe.tsx hound-mark-metal.tsx ember-field.tsx comet-trail.tsx desk-orb.tsx
    chapters/01-overture.tsx … 10-ledger.tsx
    den-desk.tsx universe-view.tsx  (existing, restyled in P4)
  routes/
    __root.tsx  index.tsx  sky.tsx  universe.tsx(→redirect /sky)  scanner.tsx  den.tsx  playbook.tsx  login.tsx
```
Delete when replaced: `hero-film.tsx`, `tear.tsx`, `three/sniff-scene.tsx`, `three/hub-scene.tsx`, `three/universe-scene.tsx` (logic moves into `stage/` + `objects/`).

### 4.3 Key contracts (builders must follow these exactly)

**Stage store** (`src/lib/stage/store.ts`)
```ts
export type Mode = "edition" | "sky" | "den" | "quiet";
export type Quality = "high" | "mid" | "low";
type StageState = {
  mode: Mode;
  chapter: number;          // 0..9, index into WAYPOINTS
  progress: number;         // 0..1 within current chapter
  pointer: [number, number];// -1..1, smoothed in useFrame, not here
  focus: string | null;     // symbol under focus (sky / hover)
  scanAt: number;           // performance.now() of last scan-line pass
  quality: Quality;
  reduced: boolean;
  set: (p: Partial<Omit<StageState, "set">>) => void;
};
```
**Waypoints** (`src/lib/stage/waypoints.ts`): `Record<ChapterId, { cam: [x,y,z]; look: [x,y,z]; fov: number; light: Sector | "hound" | "all" | "none"; dimOthers: number }>`. CameraRig damps toward `lerp(wp[i], wp[i+1], ease(progress))` using `THREE.MathUtils.damp` (λ≈3), plus a pointer offset ±0.15.

**Chapter primitive** (`components/edition/chapter.tsx`)
```tsx
<Chapter
  id="sniff" numeral="II" index={1}
  title="Sniff"
  swash="Every five minutes, the hound lifts its nose."
  plate={<RadarView />}      // DOM + optional drei <View> for the 3D object
  sheet={<SniffSheet />}     // optional; parchment | glass via `tone`
  tone="parchment"
  plateHeight="170svh"       // scroll distance the plate stays sticky
/>
```
Inside, one GSAP timeline per chapter, `scrub: 0.8`, trigger = chapter wrapper, `start: "top 80%"`, `end: "bottom 50%"` (the only values that line the table up with the sheet geometry, S5). Chapter I uses `start: "top top"`, or it loads at progress ≈ .4 and its reveal never plays. Never name a file `*.client.*` (TanStack Start import protection breaks `vite build`, S5). SplitText `mask: "lines"` clips glyphs at lh .84: pad the line class and pull it back with a negative margin.
| progress | what |
|---|---|
| 0.00 | store.chapter = index; fire scan-line (`scanAt = now`); ScrambleText the index item |
| 0.00–0.22 | mega title SplitText chars `yPercent 120→0`, stagger .018, ease `power3.out`; mask gradient sweeps (scanned-in look) |
| 0.12–0.32 | swash subtitle: `filter blur(14px)→0`, `opacity 0→1`, y 24→0 |
| 0.00–1.00 | `store.progress` = raw ScrollTrigger `self.progress` from `onUpdate` (not `tl.progress()`; the CameraRig damps it) |
| 0.55–0.80 | title drifts up `yPercent −30` and fades to .25 while the sheet rises over it |
| 0.60→ | sheet (in normal flow after the sticky plate) overlaps via `margin-top: -40svh; z-index: 10` |

**SourceTag**: `<SourceTag kind="live" ts={…} />` → mono chip `LIVE · 12:04`, `SAMPLE`, `PAPER`. **Required** next to any figure.

**GlassPanel** (DOM liquid glass, our own, see S3 + its Addendum): **two sibling layers**, because the single filter chain costs ~100 fps at 3 panels in Chromium. (1) Interior: plain `backdrop-filter: blur(18px) saturate(1.4)`, masked to exclude the rim band. (2) Rim layer, masked to a 26 px band: `backdrop-filter: url(#rim) blur(3px) saturate(1.4)`, where `#rim` = `feImage` normal map (displacement along the outward normal, profile `5·e^(−0.8d) + e^(−0.15d)`, ported from dashersw/liquid-glass-js, MIT) → `feDisplacementMap` scale `refract · 30` px. Chromium only (detected after mount via `navigator.userAgentData.brands`); Safari/Firefox get the interior blur only. Plus inner rim highlight (two inset box-shadows), top specular gradient, 1px `--line` border, tint `rgb(12 18 36 / .35)`, and a solid-tint fallback under `prefers-reduced-transparency: reduce` or no `backdrop-filter`. Props: `radius`, `tint`, `refract` (0–0.5, default 0.4; above ~0.8 the rim streaks). The `.glass` utility lives in `styles.css`.

**TornEdge**: procedurally generated path (seeded value noise, 3 octaves, amplitude 10–28px) + fibre edge (`feTurbulence baseFrequency .9` displacement 3px) + paper texture. Variants `top | bottom`, `seed`. Replaces the zigzag `Tear`.

### 4.4 Data layer
- **Dev proxy:** `vite.config.ts` → `server.proxy: { "/api": "http://127.0.0.1:8000" }`. The scanner keeps running from `WhaleHunterAlt\scanner`.
- `lib/scan/api.ts`: port of WhaleHunterAlt `fetchScan` (keep the **labelled** sample fallback).
- `lib/scan/use-scan.ts`: TanStack Query, `refetchInterval: 30_000`, `staleTime: 25_000`, key `["scan", {min, hold, lev}]`. Exposes `{rows, meta, live, ts, nextPollIn}`.
- `lib/scan/adapter.ts`: `toStars(scan, layout = scent.ts)`: merge live rows with layout (sector/pos/blurb). Unknown symbols get a deterministic position from a symbol hash in an "Uncharted" ring. Embers come from `meta.skipped_*` with reason text per list. Brightness = clamp(|net_apr| / 60), twinkle = 1 − persistence, color = direction (short Lighter → scent, short Binance → scan).
- `lib/scan/history.ts`: `/api/history?sym=&hours=24` (after T41). Before T41, trails render only with a `SAMPLE` tag.
- Remove every place that shows `trailFor()` output or `scent.ts` figures as if they were live.

### 4.5 Library usage map (what each one is *for*)
| Library | Use it for | Don't use it for |
|---|---|---|
| **@react-three/fiber** (installed) | SkyStage, all 3D | — |
| **@react-three/drei** (add) | `View`, `PerformanceMonitor`, `MeshTransmissionMaterial`, `Instances`, `Line`, `Html` labels, `Float`, `AdaptiveDpr` | `Stars` (we write our own instanced starfield for the scan flare) |
| **@react-three/postprocessing** + `postprocessing` (add) | Bloom, Noise, Vignette, ChromaticAberration (scan only) | DOF on low tier |
| **gsap** (installed, all plugins free) | ScrollTrigger, SplitText, ScrambleText, DrawSVG (index stars, torn edges, beams) | hover states |
| **lenis** (add) | smooth scroll | — |
| **motion** (add, required by magicui) | menus, hover, magicui internals, HoundMenu port | anything scroll-scrubbed |
| **shadcn/ui** (CLI, Radix flavour, matches installed Radix) | button, card, table, tabs, tooltip, hover-card, slider, sheet, dialog, command, badge, scroll-area, separator, sonner, toggle-group | — |
| **magicui** (via shadcn CLI) | `number-ticker` (APRs), `border-beam` (scanning card border), `marquee` (symbol tape), `animated-beam` (two-leg diagram), `orbiting-circles` (venues around a coin), `hyper-text` (HUD decode alt), `ripple` (radar ping, DOM fallback), `meteors` (rare shooting stars, Overture only) | particles/stars (3D owns that) |
| ~~@shadergradient/react~~ | **Removed after S2**: built for three 0.169/R3F 8, its shaders fail on three 0.186; nebula is a custom fbm shader | — |
| **liquid-glass-js** (dashersw, `github.com/dashersw/liquid-glass-js`, MIT) | **Reference only**: its normal-direction rim/edge refraction profile is ported into GlassPanel (S3 Addendum). Note: the npm package `liquid-glass-js` is a **different** project (eamonliu) | runtime dependency |
| **@paper-design/shaders** (via `shaders-react`, Apache-2.0) | Liquid-metal **hound mark** in the Overture + loader: the exported `liquidMetalFragmentShader` + `toProcessedLiquidMetal` as a material inside SkyStage (S4 option b). `colorBack` alpha 0, `--starlight` tint at 50%. Pre-bake the image processing (~0.8 s cold) so it doesn't stall the boot sequence | body content; its own canvas |

---

## 4.6 Design skill: Impeccable (chosen over emilkowalski/apple-design)
- **Why Impeccable:** the owner already uses it. `WhaleHunterAlt/PRODUCT.md` is written in its `impeccable:product-schema`, so the product context carries straight over. Its commands also map onto our phases (critique/audit for review, polish for the finish, typography/motion passes). Apple-design pulls toward restrained, light, system-UI calm, which is the opposite of an editorial deep-space scroll.
- **Setup (T00b):** install Impeccable into this repo for Claude Code (same method used for WhaleHunterAlt; the public repo is `pbakaus/impeccable`). Copy `WhaleHunterAlt/PRODUCT.md` → `HedgeHound/PRODUCT.md` and update it (Platform/Stack lines, Brand Commitments = §2 of this plan). Then run Impeccable's teach/context step so it writes the design context file from §2.
- **When to run it:**
  - after T10 (tokens/type) → Impeccable critique + typography pass on a test page
  - after T15 (Overture + Sniff) → full critique; Opus folds the fixes into the primitives **before** P3 starts, so every chapter inherits them
  - each P3/P4 ticket → builder runs the audit on its own chapter before handing in
  - T52 → final critique + polish pass across the whole Edition
- Impeccable's guidance wins on *craft* (spacing, hierarchy, contrast, motion taste). This plan wins on *product rules* (data honesty, SourceTag, scanning motif, single canvas). If they conflict, note it in the ticket notes and Opus decides.
- Optional extra for motion QA only: Emil Kowalski's `review-animations` skill can be run in T52. It isn't required.

---

## 5. Phases & who does what

| Phase | Goal | Owner | Parallel? |
|---|---|---|---|
| **P0 Groundwork** | git baseline, runs on Windows, proxy, deps, shadcn/magicui, fonts, de-Grok agent files | Haiku (T00, T00b Impeccable, T01–T04), Opus reviews | sequential, ~1–2 h |
| **P1 Spikes** | Answer the 5 risky questions before building on them | Sonnet (S1–S5), timeboxed 45–60 min each | yes, all 5 in parallel (worktrees) |
| **P2 Foundation** | tokens, motion infra, SkyStage, edition primitives, **Overture + Sniff as the reference implementation** | **Opus** (T10–T15) | no, everything depends on it |
| **P3 Chapters** | III–X | Sonnet (T20–T27) | yes, one worktree per chapter (stubs pre-created in T13 so nobody edits shared files) |
| **P4 Pages** | nav, /scanner, /playbook, /sky, /den, /login | Sonnet (T30, T31, T33, T34), Haiku (T32, T35) | yes |
| **P5 Data** | live adapter everywhere; backend history endpoint | Sonnet (T40; T41 after owner OK) | T40 can start right after P0 |
| **P6 QA & polish** | screenshots, perf, a11y, reduced motion, review vs reference | Haiku runs (T50, T51), **Opus** reviews/polishes (T52) | — |

Merge order: P0 → (P1 ∥ T40) → P2 → (P3 ∥ P4) → T41 → P6.

---

## 6. Global Definition of Done (every ticket)
- `npm run typecheck` and `npm run lint` pass; no new console errors/warnings on `/`, `/sky`, `/den`, `/scanner`, `/playbook`.
- Works with the scanner **off** (sample fallback, visibly tagged SAMPLE) and **on** (LIVE).
- `prefers-reduced-motion: reduce` → readable, static, no scrubbed motion, no boot sequence.
- 390×844 mobile: no horizontal scroll, rail collapses, quality tier ≤ mid, 3D objects simplified.
- No new `<Canvas>` unless a spike approved it. No `window` access at module top level (SSR).
- Only tokens from §2.2. No hex literals in components except `lib/palette.ts`.
- Every on-screen number carries a `SourceTag` or sits inside a tagged container.
- Screenshots (desktop + mobile) attached to the ticket's notes in `docs/redesign/notes/<ticket>.md`.

## 7. Performance budget
| | high | mid | low / mobile |
|---|---|---|---|
| far stars | 6000 | 2500 | 900 |
| DPR cap | 1.75 | 1.5 | 1.0 |
| post | bloom + grain + vignette + CA(scan) | bloom + vignette | bloom only (half-res) or none |
| transmission material | yes (samples 6, res 512) | metal fallback | metal fallback |
| nebula | shader | shader @ 0.5 dpr | static gradient |
| target | 60 fps | 50+ | 30+ |
LCP < 2.5 s (SSR'd mega title), JS for 3D lazy after first paint, `frameloop` pauses when the tab is hidden.

## 8. Decisions needed from the owner (defaults in **bold**)
1. Add stdlib read-only endpoints to `scanner/server.py` (`/api/history`, per-venue rate/vol/OI fields)? **Yes**, otherwise trails and per-venue numbers stay SAMPLE.
2. Keep Grok scaffolding (better-auth, PGlite, PWA, preview bridge)? **Keep for now** (auth is already off); strip in a later cleanup ticket.
3. Edition name: **"The Can✶s Edition"**.
4. Demo login gate from WhaleHunterAlt: **port it, off by default** (env flag `VITE_DEMO_GATE`).
5. Display face: **Bricolage Grotesque** (alt: keep Syne everywhere).

## 9. Risks
- **Extra WebGL contexts**: resolved by S2/S4. One canvas, no exceptions. The legacy hero/universe canvases go when T33/T51 replace them.
- **TanStack Start SSR + R3F/drei** → hydration errors. Mitigated by S1 and `<ClientOnly>`.
- **Lenis + sticky + ScrollTrigger on iOS Safari** (address bar resize) → `ScrollTrigger.config({ ignoreMobileResize: true })`, `svh` units, S5.
- **Scope creep**: ten chapters is a lot. P3 tickets are independent, so ship I–III + VIII + X first if time is short.
- **Honesty drift**: pretty numbers are tempting. The SourceTag rule + T52 review guard it.
