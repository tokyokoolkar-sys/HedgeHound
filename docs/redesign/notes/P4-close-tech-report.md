# HedgeHound P4 phase-end critique: technical audit

Branch `P4-close` at `ad90886`. Dev server http://127.0.0.1:8089, scanner backend offline (SAMPLE data).
Method: Impeccable `audit` (context loaded, detector run over `src/` and the five live routes), plus Playwright (Chromium; headless shell for layout, new-headless `channel: "chromium"` on the real GPU, an RTX 3060 via ANGLE/D3D11, for frame times) at 1440×900, 1024×768, 768×1024 and 390×844 (isMobile, hasTouch), each with and without `reducedMotion: "reduce"`. I reproduced every finding below at least twice: once in a sweep and once in a targeted probe or screenshot.
Evidence lives under `scratchpad/p4crit/tech/`. Scripts are in `tech/scripts/`. `sweep.json` holds console, overflow and network data for 40 route×viewport×motion runs. `ed-<motion>-<vp>_/` holds Edition step-through screenshots plus `report.json`. Keyboard runs are in `kbd/`, the a11y tree in `aria/`, contrast in `contrast/`, overlaps in `ov/`, the sky flow in `sky/`, and frame times in `perf-*.json`.

## Audit Health Score

| # | Dimension | Score | Key finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3 | All 13 hairline sliders lack an accessible name (WCAG 4.1.2, level A). Under reduced motion the α→β crawl double-exposes text. |
| 2 | Performance | 3 | Frames are cheap: p50 2.5 ms, p90 3.7 ms unlocked at 1440 on GPU. The canvas still renders every tick while idle, and the prod bundle was not measured. |
| 3 | Theming | 3 | Tokens hold everywhere except one slip: the carousel paints a negative net (DOGE −1.5%) in scent orange. Template colour leftovers remain. |
| 4 | Responsive Design | 3 | No horizontal overflow at any width. At 390 the ledger's Canis Major labels collide, and the reduced-motion crawl is unreadable. |
| 5 | Implementation Integrity | 3 | Coherent and product-specific. A few verified rule breaks: per-word blur reaches about 11 px on visible words (the rule is 3 px), the nav jumps on load, and the ledger footer is missing Scanner. |
| **Total** | | **15/20** | **Good** (address weak spots) |

## Implementation Integrity verdict

**Pass.** The implementation is clearly its own system:
- One WebGL canvas (`components/stage/sky-stage.tsx:53`, the only `<Canvas>`).
- GSAP is loaded only inside an effect (`lib/motion/scroll-engine.tsx:20`), and `motion` is used only for the shimmer.
- There is no `window`/`document`/three/gsap at module top level in routes or shared files. Every hit is inside a function, effect or handler.
- Token discipline holds. Hex literals outside `palette.ts` and the `styles.css` `@theme` block are limited to a mask-canvas `"#000"` (`edition/masks.ts:39,98`, a functional alpha fill), a GLSL comment (`objects/radar.tsx:36`) and template auth plumbing (`lib/auth/popup.server.ts:137`).

The detector's findings were checked in context:
- `gradient-text` is in the unused `text-fx` kit (JOURNAL #29, already open).
- `cramped-padding` and `low-contrast 1.4:1` on `/` are **false positives**: both hit the shimmer title's `background-clip:text` box, where the "background" is the glyph fill.
- `all-caps-body` on `/playbook` is real but minor (P3-4).

The rule breaks that do exist are listed as P2-2, P2-3 and P2-7.

## Code checks

| Check | Result |
|---|---|
| `npm run typecheck` | pass (exit 0) |
| `npm run lint` | 1 error, the known one: `src/lib/app-data/client.server.ts:281` no-empty. Nothing new. |
| `npm test` | 443/443 pass |
| Second `<Canvas>` | none |
| Top-level `window`/`document` in routes/shared files | none |
| Hex outside allowed files | `edition/masks.ts:39,98` (`#000` mask fill, acceptable), `lib/auth/popup.server.ts:137` (`#0b0b0c`, `#a1a1aa`; template), comment in `objects/radar.tsx:36` |
| Console, all 40 runs | Only the expected 502 on `/api/scan` (plus its `requestfailed` and "Failed to load resource") and the `THREE.Clock` deprecation. One `GPU stall due to ReadPixels` driver message appeared on `/` 1440 in the SwiftShader headless shell, during a Playwright screenshot. No app code reads pixels. No page errors, hydration warnings or 404s. |
| Horizontal overflow | None. `scrollWidth == innerWidth` on every route at every width, and no inner region scrolls sideways. At 390 the Mirzam and Furud Bayer labels sit off-screen inside the `overflow-hidden` label layer at page top, at opacity 0. They cause no scroll. |
| CLS | 0.004–0.010 on `/`. The source is the nav, not content (P2-3). |

## Findings

### P1 (major)

**P1-1. Reduced motion: the α→β carousel double-exposes over Canis Major and then over the radar** (Responsive / Accessibility)
- **Where:** `/` under `prefers-reduced-motion: reduce`, in the `#chapter-sniff-enter` section. Worst at 390; also at 1440.
- **What:** Reduced motion shows the carousel for crawl progress `c ∈ (0.26, 0.74)`. Over the same range:
  - Canis Major stays on with its labels while `c < 0.5` (`canisOn = h > 0.5 && c < 0.5`, with labels forced to 1).
  - The radar turns on at `c ≥ 0.5`, and under reduced motion its labels and reading are on at once.
  - Result at 390: carousel symbols and figures sit on top of the star names ("Adhara" × "−20.7%", "Aludra" × "−9.3%", "σ" × "ETH", "κ" × "SAMPLE"), which is unreadable.
  - Result at 1440, c 0.5–0.7: "−20.7%" and "−26.0%" overlap "◂ short Binance", and the carousel sits across the radar while the 1000PEPE reading shows beside it.
  - The motion version is clean, because the crawl hides the scene. This is exactly the "static, fully readable Edition" path PRODUCT.md promises.
- **Repro:** `ed-steps.mjs` with rm.
  - Overlaps are listed in `tech/ed-390-rm.txt` and `tech/ed-1440-rm.txt`.
  - Screenshots: `tech/ed-rm-390_/chapter-sniff-enter-30.png`, `tech/ed-rm-1440_/chapter-sniff-enter-30.png` and `-50.png`. Compare with the motion run in `tech/ed-m-1440_/chapter-sniff-enter-50.png`.
- **Likely cause:**
  - `components/edition/symbol-carousel.tsx:24` (reduced window 0.26–0.74)
  - `components/edition/edition.tsx:78–81` (`canisOn`; `canisLabels` forced to 1 under reduced motion)
  - `components/chapters/sniff-scene.ts:38–39` (`radarOn` at c ≥ 0.5, with labels and reading on immediately under reduced motion)
- **Fix:** give each its own slot under reduced motion. For example, Canis Major off once `c ≥ 0.2`, the carousel shown only for `0.25 < c < 0.7`, and `radarOn` only from `c ≥ 0.75` (or from `b > 0`). Add a unit test in `lib/stage/rhythm.test.ts` or `choreo.test.ts` asserting that at no `c` are the carousel and another instrument both on when `reduced` is true.

**P1-2. Every hairline slider is unnamed in the accessibility tree** (Accessibility, WCAG 4.1.2 Name, Role, Value, level A)
- **Where:** `/den` (12 sliders: the book and the what-ifs) and `/scanner` (the net floor), at all widths.
- **What:** `aria-labelledby` is set on Radix `Slider.Root`, which is a plain span with no role. The focusable `role="slider"` thumb has no `aria-label` or `aria-labelledby`. Playwright's aria snapshot lists bare `- slider` entries, and screen readers announce "slider, 15" with no label. `aria-valuetext` is present and good.
- **Repro:** `aria.mjs` on `/den`. See `tech/aria/den.txt` (all 12 have label=null, labelledby=null) and `tech/aria/aria-m-1440_den.yml`.
- **Likely cause:** `components/controls/hairline-slider.tsx:30` and `:39`.
- **Fix:** move the labelling to the thumb, as `<Slider.Thumb aria-labelledby={id} aria-valuetext={text} …/>`, or pass `aria-label={label}`. Keep or drop it on Root.

### P2 (minor, but fix next pass)

**P2-1. The symbol carousel paints a losing coin in scent orange** (Theming / honesty of signal colour)
- **Where:** `/`, α→β crawl, every width with motion. DOGE shows **−1.5%** in orange, and LINK 2.0% also shows orange (status ok).
- **What:** `carouselRows` sets `alert: r.status === "ok"` and ignores the sign. Everywhere else orange means "clean **and paying**": coin search (`coin-search.tsx:73`), sky labels and reading (`sky-page.tsx`), the scanner table and DESIGN.md. Under reduced motion the first group happens to render correctly (only AVAX is orange), so the bug shows only as the groups cycle.
- **Repro:** `tech/ed-m-1440_/chapter-sniff-enter-50.png`; crop `tech/evidence-carousel-doge-orange.png`.
- **Likely cause:** `src/lib/scan/loudest.ts:20`.
- **Fix:** `alert: r.status === "ok" && r.net_apr > 0`. Add a case to `loudest.test.ts`.

**P2-2. Body words blur to about 11 px while visible, against the 3 px BODY_BLUR rule** (Implementation Integrity)
- **Where:** `/` α Canis Major body ("Every coin is a star…"), and any chapter using `bodyWords`.
- **What:** `wordLook` blurs each word up to 14 px. At canis progress 0.48–0.51, 8–19 words at opacity > 0.2 carry 9.8–10.8 px blur. That is the "grey fog" DESIGN.md forbids ("body copy never blurs past 3px"). It is clearly visible at 390.
- **Repro:** `tech/blur-canis-1440.txt`, plus `tech/ed-m-390_/chapter-canis-50.png`.
- **Likely cause:** `src/lib/motion/choreo.ts:110` (`blur: (1 - k) * 14`).
- **Fix:** `blur: (1 - k) * BODY_BLUR`. Add a `motion.test.ts` assertion that `wordLook(...).blur <= BODY_BLUR`.

**P2-3. The nav jumps about 250 px sideways on every page load** (Responsive / layout jump; the owner treats layout jumps as bugs)
- **Where:** all routes, from 768 up. At 1440 the link group starts at x=861 and jumps to x=609 about 150 ms after paint.
- **What:** `PollStatus` returns `null` until mount and until the scan settles, then inserts "scanner offline ○ SAMPLE" (or "next poll … ● LIVE"). This pushes Edition…Playbook left. It is the only layout-shift source on `/` (CLS 0.004–0.010).
- **Repro:** `tech/scripts/navjump.mjs` gives positions 861 → 609 at 207 ms → 364 ms; frames are in `tech/navjump-2.png` and `navjump-3.png`. The layout-shift sources are in `tech/ed-1440-m.txt`.
- **Likely cause:** `components/nav/poll-status.tsx:15`, with layout in `components/nav/site-nav.tsx:38–52`.
- **Fix:** render a placeholder of the same footprint during SSR and loading (for example `visibility:hidden` "scanner offline ○ SAMPLE"), or move the status after the search button so the links never move. Keep `tabular-nums` for the live countdown.

**P2-4. Closing the coin search or the phone menu drops focus to `<body>`, and the menu button has no expanded state** (Accessibility, WCAG 2.4.3 Focus Order)
- **Where:** every route. Desktop "search ⌘K", ⌘K, Ctrl+K and "/" open the search. The phone "menu" opens the menu.
- **What:**
  - Open with the keyboard and press Esc, and focus lands on `BODY`, not the trigger. The next Tab restarts from the top of the document.
  - The "menu" button has `aria-haspopup="dialog"` but no `aria-expanded` or `aria-controls`.
  - Esc does close both dialogs, and ⌘K, Ctrl+K and "/" all open the search with the input focused.
- **Repro:** `kbd.mjs` gives `focusReturnToBtn` = body text on all five routes (`tech/kbd/kbd-1440-*.txt`). `aria.mjs` at 390 gives `menuFocusReturn: "BODY"` and `menuExpandedAttr: null` (`tech/aria/home390.txt`).
- **Likely cause:** the dialogs are opened by state from plain buttons, not `Dialog.Trigger`, so Radix has no trigger to return to. See `components/nav/site-nav.tsx:45–63` and `components/nav/coin-search.tsx:42`.
- **Fix:** wrap the buttons in `<Dialog.Trigger asChild>` (the search dialog needs its trigger inside its `Root`, or a shared ref), or add `onCloseAutoFocus={(e) => { e.preventDefault(); lastFocused?.focus() }}` that remembers `document.activeElement` on open, which also covers the shortcut opens. Add `aria-expanded={menu}` to the menu button.

**P2-5. Forced colours (Windows High Contrast): the shimmer titles go invisible and the reading turns to noise** (Accessibility)
- **Where:** `/` at 1440 with `forcedColors: "active"`.
- **What:** `ShimmerText` sets `-webkit-text-fill-color: transparent` with `background-clip:text`. In forced colours the background is dropped, so chapter titles ("Sniff") render as a dark outline on the black canvas. The β reading (1000PEPE, built from Stardust specks) renders as dithered noise. Working pages (`/scanner`) are fine.
- **Repro:** `tech/scripts/forced.mjs`; see `tech/forced_.png` against `tech/forced_scanner.png`.
- **Likely cause:** `src/components/shimmer-text.tsx:202–209`; Stardust in `components/edition/stardust.tsx`.
- **Fix:** add `@media (forced-colors: active) { [data-shimmer] { -webkit-text-fill-color: CanvasText; background: none } }` (and a `data-shimmer` hook). For Stardust, show the plain text with the specks hidden.

**P2-6. 390, κ Ledger: Canis Major labels collide** (Responsive / artefact)
- **Where:** `/` at 390, `#chapter-ledger` at 0.3–0.92 (the closing image).
- **What:** "η ALUDRA" runs into Adhara's "ε" (5×10 px overlap), and the Wezen→Adhara line crosses "ALUDRA". At 390 the re-formed constellation is smaller than in α, where the same labels clear.
- **Repro:** `tech/ed-m-390_/chapter-ledger-50.png`; crop `tech/evidence-ledger390-aludra.png`. Overlap list in `tech/ed-390-m.txt` and `ed-390-rm.txt`.
- **Likely cause:** the label offsets in `components/objects/canis-major.tsx` (around lines 104–118), with scale set by `components/chapters/ledger-scene.ts`.
- **Fix:** when the ledger constellation is drawn small (stacked), keep Bayer letters only (drop proper names), or put Aludra's name on the left of its star. Alternatively, keep the ledger's constellation at α's phone scale.

**P2-7. The ledger footer is missing "Scanner" and repeats the "Pages" landmark name** (Implementation Integrity / Accessibility)
- **Where:** `/`, κ footer, all widths.
- **What:** the file's own owner decision is "(b) the same links as the nav", but `LINKS` lists Edition, Sky, Den and Playbook with no Scanner. The footer `<nav aria-label="Pages">` duplicates the header's landmark name, so a screen reader's landmark list shows two "Pages".
- **Repro:** `tech/ed-m-390_/chapter-ledger-50.png`; landmarks in `tech/kbd/kbd-1440-home.txt`.
- **Likely cause:** `components/chapters/10-ledger.tsx:23–28` and `:57`.
- **Fix:** import the nav's `LINKS` (export it from `site-nav.tsx`) and rename the footer landmark to "Pages, again" or "Footer".

### P3 (polish)

- **P3-1. /sky reading actions sit before the list in tab order (desktop).** After Enter on "ARB" in the list, Tab moves on to SUI, WIF and the rest. "Open in scanner →" and "pull back · esc" can only be reached with Shift+Tab, because they render earlier in `main` than the `<aside>`. Fix: render the reading after the aside, or move focus to the reading's heading on focus (`aria-live` already announces it). See `components/sky/sky-page.tsx:225–253` and `tech/sky/` output. On phones "pull back · esc" mentions a key phones don't have.
- **P3-2. No skip link.** On `/` a keyboard user passes 7 nav stops and 10 chapter letters before page content, and the working pages have 7. Add a visually-hidden-until-focused "Skip to content" in `__root.tsx`.
- **P3-3. The α–κ rail letters are 8×13 px targets.** They pass WCAG 2.5.8 on spacing (checked with a 24 px circle), but they are hard to hit with a mouse. Pad the hit area (`px-2 py-1 -mx-2`) without changing the glyph. See `components/edition/chapter-index.tsx:28–40`.
- **P3-4. Long uppercase sentences.** These run 112–119 characters in the label style (detector `all-caps-body`):
  - `/playbook`: "Open question: the Monte Carlo defaults are my assumptions…"
  - Hedge beat note on `/`: "Clean first, then still building · loudest first · shaky = …"
  Use sentence case or the body face for anything over about 60 characters.
- **P3-5. Template leftovers that reach the browser:**
  - The web manifest is named **"Grok App"** with `#000000` colours. See `scripts/grok-pwa-shared.mjs:9` and `server/middleware/grok-pwa.ts`, linked from `routes/__root.tsx:27–28`.
  - `shimmer-text.tsx:158–179` still carries 19 colour variants (red/green/amber… Tailwind classes). Tailwind scans them, so they are generated CSS and go against "no red, no green". Delete `variantMap`.
  - The `text-fx` kit with the gradient text is JOURNAL #29, already open.
- **P3-6. Reduced motion leaves the previous instrument up through the crawl section.** During `#chapter-hedge-enter` 0–0.5, δ's "−24 h · now · 1000PEPE · the last 24 h" stay on alone, and the same happens for η's stream heads in `#chapter-sky-enter`. Nothing overlaps, but it is a stale scene with no copy. Hide departing instruments at `enter > 0` when reduced. See `tech/ed-1440-rm` visible list.
- **P3-7. The sky renders every tick even when idle.** `SkyStage` uses `frameloop="never"` but advances on every gsap tick, so the canvas and postprocessing redraw continuously. Measured idle main-thread cost is small: about 2–4 % on `/scanner`, `/den` and `/playbook`, about 7 % on `/` at the headless 30 fps cap, and about 94 % with 4× CPU throttle unlocked at 390. Consider skipping `advance()` when scroll, pointer and scene are unchanged and no ambient object (twinkle, sweep) is on screen. See `components/stage/sky-stage.tsx:37–45`.

## Performance numbers

Data is SAMPLE (scanner offline); dev server, so bundle sizes are unminified.

**Frame times while wheel-scrolling the whole Edition (Lenis on)**

| Run | Frames | p50 | p90 | p99 | max | > 33 ms |
|---|---|---|---|---|---|---|
| 1440, real GPU, vsync-capped headless | 1613 | 31.3 ms (environment cap) | — | 31.7 ms | — | 2 |
| 1440, vsync unlocked | 9242 | **2.5 ms** | 3.7 ms | 28.7 ms | 94 ms | 4 |
| 390, 4× CPU throttle, unlocked | 3016 | 14.7 ms | 18.9 ms | 43 ms | 322 ms | 91 (3 %) |

- In the capped run, idle and scrolling look the same, so the 31 ms is the environment, not the app.
- The 390 throttled run is fine for a mid-range phone; the long frames line up with chapter/data mounts.
- Files: `tech/perf-1440-chromium.json`, `perf-unlocked-1440-chromium.json`, `perf-unlocked-cpu4x-390-chromium.json`.

**Transfer**
- Dev JS is about 49.5 MB unminified for `/` including the lazily loaded 3D chunk: three-stdlib dev dep 13.5 MB, drei 8.1 MB, three 5.8 MB, postprocessing 1.7 MB.
- `lucide-react` (3.6 MB dev) is pulled in only by `lib/error-component.tsx`. In prod it is tree-shaken to one icon.
- **Prod bundle not measured**: I skipped `vite build` so I wouldn't touch the repo or the shared dev server. Run `vite build` with a visualizer and confirm the 3D chunk is split from the first paint and that drei/three-stdlib tree-shake to `PerformanceMonitor`, `Html` and `SVGLoader`.
- FCP on dev: about 45–110 ms locally.

## Positive findings

- **Keyboard:**
  - Every interactive element is reachable and named, apart from the sliders (P1-2).
  - Focus is a crisp 2 px cyan outline on every link and button, and a cyan ring on slider thumbs.
  - No keyboard traps.
  - ⌘K, Ctrl+K and "/" open search with the input focused, and Esc closes search, the menu and the sky focus.
  - The phone menu traps focus correctly.
- **Contrast:**
  - Token ratios on void: starlight 18.5:1, starlight-dim 7.05:1, scan 13.5:1, scent 8.9:1, starlight at 0.82 is 12.2:1.
  - starlight-faint (3.14:1) is never used for text. Its only text-colour uses are SVG strokes in `04-trail.tsx`.
  - No settled text on any route falls below AA. The only sub-AA readings were mid-fade frames.
- **Screen readers:** every chapter's copy is duplicated as sr-only text in its scroll section, and the fixed visual blocks are `aria-hidden`. No focusable element sits inside an `aria-hidden` ancestor. `/sky` announces the focused coin through `aria-live`.
- **Reduced motion:** no Lenis, no intro animation, no shimmer, radar sweep and twinkle held, and the copy is fully visible in every chapter. Nothing is stuck invisible.
- **Responsive:** no horizontal scroll at 390, 768, 1024 or 1440 on any route. The scanner table re-lays out to two-line rows below 1024.
- **Honesty:** SourceTags are present on every figure group checked (nav, search, carousel, radar, reading, scanner, sky, den, ledger), and the true minus (−) is used throughout.
- **Rules:** SSR, one canvas and token rules all hold. Typecheck, the tests (443/443) and the one-canvas check are all green.

## Recommended actions

1. **[P1] `/impeccable harden`**: fix the reduced-motion slots in the α→β crawl (P1-1) and name the slider thumbs (P1-2).
2. **[P2] `/impeccable polish`**: fix the carousel orange (P2-1), body-word blur (P2-2), nav jump (P2-3), ledger labels at 390 (P2-6) and footer links/landmark (P2-7).
3. **[P2] `/impeccable harden`**: return dialog focus and add `aria-expanded` (P2-4), and add forced-colours fallbacks (P2-5).
4. **[P3] `/impeccable distill`**: remove the manifest "Grok App", the shimmer colour variants and the unused text-fx kit (P3-5).
5. **[P3] `/impeccable optimize`**: add idle render gating (P3-7) and measure the prod bundle.
6. **`/impeccable polish`**: a final pass, then re-run `/impeccable audit`.

Note on shared scratch space: early in the run I wrote `probe.mjs` and `wide.mjs` into the shared `p4crit/scripts/` folder before noticing another auditor uses it. I may have overwritten that agent's `probe.mjs`. All my scripts now live in `p4crit/tech/scripts/`.
