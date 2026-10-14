# HedgeHound — "The Canis Edition" redesign plan

Owner: Opus (lead) · Builders: Sonnet · Chores/QA: Haiku
Repo: `E:\ataspace\BuiltwGrok\HedgeHound` (this folder) · Backend: `E:\ataspace\WhaleHunterAlt\scanner\server.py` (stays where it is)
Tickets: `docs/redesign/TICKETS.md` · Agent rules: `CLAUDE.md`
**Design: `DESIGN.md` (repo root) is binding for look and motion. It records the owner's taste; read its first section before any UI work.** Prototype of record: route `/_almagest` on branch `D1-almagest`.

---

## 0. TL;DR

> **Direction changed on 2026-10-13 ("Almagest", spike D1).** The owner scrolled a live prototype through three rounds and set the look. `DESIGN.md` is the source of truth for colour, type, layout and motion. This plan keeps product, data, architecture and process.

Rebuild HedgeHound's front end as a long-scroll **Edition**: a funding-spread **observatory at night**. It keeps the fluid scroll of Shopify Editions (Renaissance, Winter 2026), but the world is a real night sky instead of paintings and paper.

| Shopify Editions does… | HedgeHound does… |
|---|---|
| Renaissance paintings as full-bleed plates | **One persistent 3D night sky** (single R3F canvas): near-black, dense faint stars in parallax layers. Each chapter is an instrument in the sky (the glass hound, Canis Major, the radar…) |
| Cream paper sheets with torn edges | **Copy straight on the sky.** No sheets, cards or glass behind text (owner: "white and black already contrast to read") |
| Index rail with Roman numerals | Index of **Greek Bayer letters α–κ**, the active one lit cyan |
| Neo-grotesk titles + swash serif subtitles | **Two fonts:** Noto Serif Display at its thinnest (ancient but modern) + JetBrains Mono |
| Scroll-driven transitions | **Scroll-locked "bite" transitions:** pixels eat the scene into shimmering stars, then rebuild the next one. Nothing moves while the scroll is still |
| — (our twist) | **Real astronomy as ornament:** Canis Major from J2000 positions, Sirius's RA/DEC in the HUD, the scanner as a radar sweep, readings that gather out of star specks |

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

## 2. Art direction (summary; `DESIGN.md` is normative)

### 2.1 Concept: "The observatory at night"
The sky is the interface. Coins are stars, the scanner is a radar sweep, and every chapter is a region of sky you scroll through. Real astronomy is the ornament: Canis Major is a hound, and its brightest star Sirius sits at **RA 06h 45m 09s · DEC −16° 43′**, which is the home coordinate in the HUD. The Greek Bayer letters (α Sirius, β Mirzam …) give the ancient-Greek layer; Ptolemy's *Almagest* and the Babylonian star catalogues are the lineage.

### 2.2 Colour
Void `#010104` · Starlight `#f4f1ea` (0.62 dim, 0.38 faint) · Chart line `#9aa0ad` · **Scan cyan `#7fdcff`** (scanning, long leg, Bayer letters, focus) · **Scent orange `#ff8a3d`** (alerts, short leg). There is no other accent: no red or green, no nebula washes, no parchment. Star tints (`#c9d6ff` cool, `#ffe2c4` warm) are for stars only. Hex values live in `src/lib/palette.ts` and the `@theme` block of `styles.css` (kept in lockstep by `palette.test.ts`).

### 2.3 Type
**Noto Serif Display Variable**: titles at weight ~180 (hero `clamp(3.2rem, 9vw, 8.5rem)`), italic subtitles and body at ~330. **JetBrains Mono Variable**: labels, HUD, Greek letters and figures (300, uppercase, 0.22em tracking for labels; tabular numbers for figures). Titles use `@spell/shimmer-text`. Retired: Bricolage, Fraunces, Pinyon, Syne, Marcellus, EB Garamond.

### 2.4 Layout
- One canvas fills the viewport. Copy lives on a **fixed stage** above it, and scroll length sets each scene's duration.
- Copy column on the left (`max(16px, 7vw)`, ~500px); the chapter's instrument on the right.
- HUD: drifting coordinate top-left, edition name top-right, α–κ index on the left edge.
- Mobile: instrument above copy, HUD reduced to the coordinate, no horizontal scroll.

### 2.5 Motion (the owner's rules)
1. **Scroll-locked.** Transitions, reveals and crawls are pure functions of scroll progress, with no clocks: stop scrolling and they freeze. Lenis on `gsap.ticker` gives the fluid feel. Only ambient life runs on time (star twinkle, radar sweep, carousel cycle).
2. **The bite crawl** between scenes:
   - a ragged front rises
   - every 4px cell (plus 14px chunks) has a fixed moment to be bitten, and once bitten stays gone
   - the eaten area shows sparse stars that shimmer only while scrolling
   - the next scene rebuilds cell by cell
   - dither is the default
   - the same bites apply to DOM text through generated mask frames
3. **Entrances grow from where they connect.** A reading draws its leader line, then gathers out of 2px star specks; chapter copy rises from below the screen with the scroll; titles resolve from blur and shimmer.
4. **The glass hound** (Overture) moves only with the cursor and recedes exponentially into depth, and the constellation's stars burst out where it vanished.
5. **Banned:** bloom, glow halos, haze, drop shadows, sliding gradient masks pretending to be pixels, ScrambleText decode effects.
6. `prefers-reduced-motion: reduce`: static sky, no crawl, plain fades, no scroll-linked motion.

### 2.6 Depth stack (back → front)
1. far star shell (slow rotation with scroll and cursor)
2. flight layer and dust (stream past with scroll: parallax)
3. the chapter's instrument
4. projected DOM labels pinned to 3D points
5. fixed-stage copy and HUD

Post: crawl effect + film grain (0.03) + vignette. No bloom.

---

## 3. Chapter map (the `/` Edition)

Copy follows `PRODUCT.md`: every number on screen is LIVE, PAPER or SAMPLE and carries a `<SourceTag>`. Copy that already exists in `hero-film.tsx` / `den-desk.tsx` is reused where it fits. Each chapter = an **instrument** (3D, right) + **copy on the sky** (left), joined to the next by a bite crawl (or a lighter transition where noted).

| # | id | Title | Subtitle | Instrument (3D) | Copy on the sky |
|---|---|---|---|---|---|
| — | `overture` | HedgeHound (wordmark, shimmer) | "A funding-spread observatory · paper only" | **Glass hound**, cursor-only motion; recedes exponentially on scroll | none, then the scroll cue `↓ α` |
| α | `canis` | The hound in the sky | — | **Canis Major** (J2000): stars burst out of the hound, lines draw in, Bayer letters appear | "Every coin is a star…", rising with the scroll; positions note. Exit: **bite crawl** with the symbol carousel (net APR, tagged) at full grain |
| β | `sniff` | Sniff | "Every five minutes, the hound lifts its nose." | **Radar**: coins by angle = hash(symbol), radius = f(net APR), cyan sweep, pings; the loudest reading drawn out on a leader line and gathering from star specks | Normalize / Cancel / Doubt; "What the scanner checks" (poll 300 s, 144-sample average, 30-day listing rule, $250k vol, $50k OI, zero-rate filter) |
| γ | `spread` | One coin. Two legs. | "Long the cheap hour. Short the rich one. Price cancels." | **Astrolabe**: thin cyan (long) and orange (short) rings around the coin, counter-rotating with the scroll, slide apart into the two venues; a price swing moves both legs while the spread hairline keeps its length | the definition of the spread + three steps; then the loudest scent's two legs, live (venues, net APR, persistence, last flip, history) |
| δ | `trail` | The Trail | "A scent only counts if it stays." | **Comet trail** over a 24 h arc, from live fields only: reach = `window_h`, solid since `hours_since_flip` (direction colour), dashed before, a six-hour bracket for `persistence` | what "stays" means; then the six steadiest coins as small strips (LIVE now; real wiggles after T41) |
| ε | `hedge` | The Hedge | "Where the hour actually disagrees." | **Field chart**: every live coin on net APR after costs × persistence, gathering into place | what makes a spread worth a second look; then the shortlist as text rows (clean first, up to 8); "Open scanner" waits for `/scanner` (T31) |
| ζ | `kennel` | The Kennel | "Faster funding, worse manners." | **Kennel**: our meme-coin list as a cluster in a faint pen; brightness = net, twinkle = 1 − persistence (measured ambient life) | why persistence has to earn the alert; then the claim checked live: kennel vs the rest medians, a verdict, the loudest kennel coins, the `1000` prefix explained |
| η | `embers` | Cold Embers | "Walked past on purpose." | Filtered coins as cooling sparks drifting down | risk rules + the live skipped lists from `meta` |
| θ | `sky` | The Sky | "Every coin, charted." | The camera pulls back to the whole atlas; "Enter the sky" dives in and routes to `/sky` with no canvas remount | none |
| ι | `den` | The Den | "A paper desk for a $20 research budget." | A small glass orb holding a pocket sky | den stats (PAPER) + "A year of what-ifs" preview → `/den` |
| κ | `ledger` | — | — | Stars fade, Sirius remains | footer: data source status, "Phase 0 · paper only", "Not financial advice. No order code exists.", links |

---

## 4. Technical architecture

### 4.1 Principles
1. **One WebGL canvas for the whole app** (`SkyStage`), mounted once in `__root.tsx`, client-only, persistent across routes. Section 3D objects render through **drei `<View>`** tracked to DOM boxes, so there's no new `<Canvas>` per section. *(S1)* The View **is** the box: `<View ref className>`. `track={ref}` is silently ignored in drei 10.7.9. DOM children of a View don't render, so overlays go in a sibling wrapper (and they block 3D pointer events where they sit). Page content sits in a `relative z-10` wrapper above the fixed z-0 canvas. **No exceptions**: the glass hound is a custom shader inside SkyStage, and there is no nebula (D1 replaced both S2's nebula and S4's LiquidMetal mark). Anything else that wants a canvas needs a new spike.
2. **SSR-safe:** everything that touches `window`/WebGL/GSAP lives behind `<ClientOnly>` or a dynamic `import()` inside `useEffect`. Text content is server-rendered (LCP = mega title, not the canvas).
3. **GSAP owns scroll** (ScrollTrigger + SplitText + ScrambleText + DrawSVG). **`motion` owns component micro-interactions** (menus, hovers, mount/unmount, magicui internals). They never animate the same element.
4. **Lenis** for smooth scroll, driven from `gsap.ticker`. `ScrollTrigger.update` runs on Lenis scroll. *(S5)* While Lenis is active, SkyStage runs `frameloop="never"` and is advanced from an `afterScroll` hook right after `lenis.raf`, so 3D and DOM agree on the same frame (otherwise 1 frame of lag); `"always"` otherwise, `"demand"` under reduced motion. Call `lenis.reset()` before `destroy()` (stale `html.lenis` class otherwise). A debounced `ResizeObserver` on `<body>` calls `ScrollTrigger.refresh()` so late fonts/content don't leave triggers stale.
5. **Fixed stage, not sticky plates** (D1). Scroll sections are empty spacers that set each scene's length; progress per section = `(scrollY − top) / height`, measured on resize (debounced `ResizeObserver` on `<body>`, S5). Copy lives on a fixed stage and is driven per frame from that progress. No GSAP `pin`, no sheets.
6. **Projected labels, not drei `<Html>`, for anything whose data refreshes.** `<Html>` mounts a separate React root per label; on data refresh it can orphan a frozen copy on screen (D1 bug). Render labels as page DOM and project them onto their 3D point each frame. Static labels (Bayer letters) may use `<Html>`.
7. **Colour pipeline:** the post stack is linear. Author custom shader colours in sRGB and write `pow(c, 2.2)`, or faint glows get lifted into grey haze (D1 bug).
8. **Zustand stage store** is the only bridge DOM → 3D. Chapters write `{chapter, progress}`, and the 3D reads it in `useFrame` via `getState()`, so 3D never re-renders React on scroll.
9. **Quality tiers** `high | mid | low` picked from drei `PerformanceMonitor` + `navigator.hardwareConcurrency` + viewport width. `prefers-reduced-motion` → static sky, no scrub, no boot sequence, instant reveals.

### 4.2 Target file tree
```
src/
  styles.css                    tokens (§2.2), type scale, utilities (DESIGN.md)
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
    edition/chapter.tsx stage.tsx chapter-index.tsx hud.tsx source-tag.tsx
            shimmer-title.tsx rise.tsx stardust.tsx projected-label.tsx bite-mask.ts
    logos-carousel.tsx shimmer-text.tsx   (@spell registry, owner-chosen)
    stage/sky-stage.tsx starfield.tsx camera-rig.tsx effects.tsx (crawl + grain + vignette) dust.tsx
    objects/glass-hound.tsx canis-major.tsx radar.tsx hedge-astrolabe.tsx ember-field.tsx comet-trail.tsx desk-orb.tsx
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
  id="sniff" letter="β" index={2}
  title="Sniff"                                   // ShimmerTitle
  subtitle="Every five minutes, the hound lifts its nose."
  length="330svh"                                 // scroll length of the scene
  enter="crawl" exit="none"                       // "crawl" | "rise" | "none"
>
  <SniffCopy />                                   // copy on the sky, left column
</Chapter>
```
The chapter writes `{chapter, progress}` to the store, and the instrument in SkyStage reads them in `useFrame`. Copy choreography is a pure function of `progress`, applied every frame on `gsap.ticker`. Reference values from D1:

| progress | what |
|---|---|
| 0.00–0.20 | (if `enter="crawl"`) second crawl front rebuilds the scene and the copy, cell by cell |
| 0.00–0.16 | title resolves from blur 12px → 0 with the shimmer; kicker "β · SNIFF" with it |
| 0.16–0.48 | body items rise and resolve in sequence (stagger 0.07) |
| 0.26–0.42 | instrument extras (β): leader line draws (first 30%), then the reading gathers from star specks |
| 0.52–0.60 | (with a second beat) the first beat blurs out; the second beat resolves 0.62–0.76, strictly after |
| 0.86–1.00 | copy blurs out upward; or the next chapter's crawl takes over |

Never name a file `*.client.*` (TanStack Start import protection breaks `vite build`, S5).

**SourceTag**: `<SourceTag kind="live" ts={…} />` → mono chip `LIVE · 12:04`, `SAMPLE`, `PAPER`. **Required** next to any figure.

**Stardust** (`edition/stardust.tsx`): bare text that gathers out of 2px specks (32 precomputed coverage frames, coverage^1.7), opacity 0.35 → 1, blur 1.6px → 0, crisp at 0.98. Scroll-driven, reversible. The masked element carries any offset itself; never offset content inside it.

**Bite mask** (`edition/bite-mask.ts`): the DOM half of the crawl. Mask frames per element size, with 4px cells + 14px chunks and a fixed random moment per cell, picked by the crawl front's position. Matches the shader exactly.

**Retired (do not build):** GlassPanel, TornEdge, SwashHeading, MegaTitle, Sheet, Plate, FeatureTable-as-card, BootSequence, ScanLine, parchment, the S3 rim refraction and the S4 LiquidMetal mark. Their spike notes stay as history.

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
| **@react-three/drei** (add) | `View`, `PerformanceMonitor`, `Instances`, `Line`, `Html` for **static** labels only, `AdaptiveDpr` | `Stars`; `Html` for refreshing data; `MeshTransmissionMaterial` (renders flat white in our pipeline; the hound uses a custom glass shader) |
| **@react-three/postprocessing** + `postprocessing` (add) | the custom **CrawlEffect**, Noise (0.03), Vignette | **Bloom (banned by the owner)**, DOF |
| **gsap** (installed, all plugins free) | `gsap.ticker` (drives Lenis + per-frame choreography), the hero's one-time intro tween | ScrambleText decode, scrubbed timelines on copy (choreography is computed from progress) |
| **lenis** (add) | smooth scroll | — |
| **motion** (add, required by magicui) | menus, hover, magicui internals, HoundMenu port | anything scroll-scrubbed |
| **shadcn/ui** (CLI, Radix flavour, matches installed Radix) | button, card, table, tabs, tooltip, hover-card, slider, sheet, dialog, command, badge, scroll-area, separator, sonner, toggle-group | — |
| **magicui** (via shadcn CLI) | `number-ticker` (APRs), `border-beam` (scanning card border), `marquee` (symbol tape), `animated-beam` (two-leg diagram), `orbiting-circles` (venues around a coin), `hyper-text` (HUD decode alt), `ripple` (radar ping, DOM fallback), `meteors` (rare shooting stars, Overture only) | particles/stars (3D owns that) |
| ~~@shadergradient/react~~ | **Removed after S2**: built for three 0.169/R3F 8, its shaders fail on three 0.186; nebula is a custom fbm shader | — |
| **@spell/shimmer-text**, **@spell/logos-carousel** (shadcn registry `@spell`, owner-chosen) | titles; the symbol carousel in the α→β crawl. `logos-carousel` needed `<style jsx>` → `<style>` (styled-jsx is Next-only) | — |
| ~~liquid-glass-js~~, ~~@paper-design/shaders~~ | **Retired with the glass cards and the liquid-metal mark (D1).** S3/S4 notes stay as history | — |

---

## 4.6 Design skill: Impeccable (chosen over emilkowalski/apple-design)
- **2026-10-13:** `DESIGN.md` (+ `.impeccable/design.json`) now exists and is what Impeccable reads for every critique, audit and polish. Its "owner's taste" section outranks Impeccable's general craft advice where they conflict.
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
- Only tokens from §2.2 / `DESIGN.md`. No hex literals in components except `lib/palette.ts` (and the `@theme` block).
- **Taste check** (`DESIGN.md` "The owner's taste"): no bloom or glow, no cards behind copy, transitions scroll-locked, no ghosts or clipped text, two fonts only.
- Every on-screen number carries a `SourceTag` or sits inside a tagged container.
- Screenshots (desktop + mobile) attached to the ticket's notes in `docs/redesign/notes/<ticket>.md`.

## 7. Performance budget
| | high | mid | low / mobile |
|---|---|---|---|
| far stars | 6000 | 2500 | 900 |
| DPR cap | 1.75 | 1.5 | 1.0 |
| post | crawl + grain + vignette | crawl + vignette | crawl only |
| glass hound | custom shader, 72 curve segments | 40 segments | 24 segments |
| bite/stardust mask frames | generated lazily per element size | same | same, 32→24 frames |
| target | 60 fps | 50+ | 30+ |
LCP < 2.5 s (SSR'd hero title), JS for 3D lazy after first paint, `frameloop` pauses when the tab is hidden.

## 8. Decisions needed from the owner (defaults in **bold**)
1. Add stdlib read-only endpoints to `scanner/server.py` (`/api/history`, per-venue rate/vol/OI fields)? **Yes**, otherwise trails and per-venue numbers stay SAMPLE.
2. Keep Grok scaffolding (better-auth, PGlite, PWA, preview bridge)? **Keep for now** (auth is already off); strip in a later cleanup ticket.
3. Edition name: **"The Can✶s Edition"**.
4. Demo login gate from WhaleHunterAlt: **port it, off by default** (env flag `VITE_DEMO_GATE`).
5. Display face: **decided: Noto Serif Display + JetBrains Mono** (D1, owner's pick).

## 9. Risks
- **Extra WebGL contexts**: resolved by S2/S4. One canvas, no exceptions. The legacy hero/universe canvases go when T33/T51 replace them.
- **TanStack Start SSR + R3F/drei** → hydration errors. Mitigated by S1 and `<ClientOnly>`.
- **Lenis + sticky + ScrollTrigger on iOS Safari** (address bar resize) → `ScrollTrigger.config({ ignoreMobileResize: true })`, `svh` units, S5.
- **Scope creep**: ten chapters is a lot. P3 tickets are independent, so ship I–III + VIII + X first if time is short.
- **Honesty drift**: pretty numbers are tempting. The SourceTag rule + T52 review guard it. (D1: red/green price moves were requested and dropped because the scanner doesn't measure price.)
- **Taste drift**: builders default to glow, cards and timed animations. `DESIGN.md` + the DoD taste check guard it; when unsure, prototype and let the owner scroll it.
