⚠️ DEGRADED: single-context (run as the design-review sub-agent; the detector ran in the same context after the visual review was written down)

# P4 close: design critique of the whole site

Branch `P4-close` at `ad90886`, dev server http://127.0.0.1:8089, scanner offline, so every figure is SAMPLE (expected).
Looked at: the Edition overture → κ (64 scroll stops each at 1440×900 and 390×844 with isMobile, mid-transition and at rest), /scanner, /sky (list click, fly, hop to a second coin, Esc, `?star=` on phone), /den, /playbook, ⌘K search (empty and typed), the phone menu, and reduced motion.
Screenshots: `scratchpad/p4crit/design/` (`desk-NN-*`, `mob-NN-*`, `*-p-*` for pages, `zoom-*` for crops, `sheet-*` for phone contact sheets, `rm*-*` for reduced motion).

## Score

Same scale as P3 (heuristics 5, 7 and 10 scored n/a), so the two numbers compare directly.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | The nav says "scanner offline ○ SAMPLE" on every page and every figure has a tag. Lost points: θ's caption and labels only reach full strength late (around 0.8), and the search count doesn't update as you type. |
| 2 | Match system / real world | 3 | Real J2000 Canis Major and honest vocabulary. Lost points: Greek β is uppercased to a Latin-looking "Β"; "jumpiness / day" and "scare / day" are unexplained. |
| 3 | User control and freedom | 3 | α–κ rail, phone chapter menu (a P3 gap, now fixed), Esc pulls back on /sky, "↑ back to the overture". |
| 4 | Consistency and standards | 2 | Orange for a negative net in the carousel. Native white and grey scrollbars. The ledger footer drops Scanner. ε labels point the opposite way from DESIGN. |
| 6 | Recognition rather than recall | 3 | Instrument keys, θ's recap letters and /sky's three groups all help. Lost points: ε's copy makes you count criteria ("the first two… first and third… the second"). |
| 8 | Aesthetic and minimalist design | 2 | Desktop at rest is showcase-grade. Phones draw instruments over titles, lines run through labels, crawl specks land on the nav, and the search box shows a white scrollbar. |
| 9 | Error recovery | 3 | Scanner off degrades to a labelled SAMPLE everywhere, with no error page. |
| **Total** | | **19/28** (68%, Acceptable, at the top of the band) | P3 scored 18/28 and P2 17/28. Scored on all ten heuristics, now that working pages exist: 5 = 3 (leverage capped at 2×, no order code), 7 = 3 (⌘K, "/", URL filters, sort), 10 = 3 (playbook, keys, captions), giving **28/40 (70%, Good)**. |

Detector (`impeccable detect --json src`): exit 0. It found 1 warning: gradient-text in `components/text-fx/gradient-wave-text.css:17`. That is the unused text-fx kit already in the journal, so nothing ships it. It also found 2 advisories for literal colours in `lib/auth/popup.server.ts:137`, which is server-side popup HTML and not on the site. No finding touches a shipped surface. The detector cannot see any of the issues below; they are all visual or behavioural.
Console: only the expected scanner-off 502 and the THREE.Clock deprecation. No page errors in any mode. No horizontal scroll at 1440 or 390 on any route.

## What works
- **It feels like the sky it claims to be.** Canis Major is drawn from real J2000 geometry: Adhara east of Sirius, Furud west, Aludra the easternmost, all checked against the real positions. The Bayer letters are proper Greek in cyan, and Sirius' real RA/DEC uses a true minus and a prime (`desk-07`, `desk-63`).
- **Honesty is built into the layout.** Every group of figures has a tag. The nav and the κ footer both say "scanner offline · showing a sample". /den says "no paper results yet: Phase 0 records none". The playbook keeps "vendor claims, unverified".
- **The four-act rhythm and the travelling coins are working.** Coins visibly fly into γ, ζ and the orb (`desk-22`, `desk-36`, `desk-54`). The empty-sky seams P3 complained about are mostly gone on desktop.
- **The working pages are crisp and quiet.** /scanner is mono rows on hairlines with no card (`desk-p-scanner-top`). The /sky reading gathers out of specks and lands sharp (`desk-p-sky-fly-mid` → `desk-p-sky-focus`).
- **Reduced motion gives a readable static Edition** (`rm2-*`).

## Findings

### P0
None. Nothing blocks a task.

### P1

**1. On phones, instruments are drawn over the chapter titles as each chapter starts.**
- Where: Edition, 390×844, at the start of γ, δ, ζ and ι (sections at about 0.08).
- What: γ's astrolabe rings sit on top of "One coin. Two legs." The δ arc cuts through "The Trail". ζ's dashed pen circles "The Kennel". ι's orb covers "The Den". This is the double exposure DESIGN's "one thing at a time" rule forbids, and it happens in four chapters, on the main title.
- Evidence: `mob-18-spread-08.jpg`, `mob-23-trail-08.jpg`, `mob-36-kennel-08.jpg`, `mob-54-den-08.jpg`, `zoom-mob-gamma-title.png`, `zoom-mob-delta-title.png`.
- Fix: in stacked layouts, gate the instrument's arrival on the copy beat having cleared the instrument's band. This is the rule β already follows ("instruments take over only after the copy has left"). Alternatively, give the instrument a reserved band above the copy's resting top and stop the copy below it. The travelling coins can wait off-screen until the gate opens.

**2. ⌘K search shows a bright native white scrollbar; other panels show native grey ones.**
- Where: ⌘K palette on every page (desktop, and grey on phone). The /sky list column has a native grey bar with arrow buttons, and so does the phone menu.
- What: an OS-default white track with up/down arrows on a hairline frame over the void. It is the most visible artefact on the site, and it sits in the interaction a showcase viewer is most likely to try.
- Evidence: `desk-p-search-open.jpg`, `zoom-search-scrollbar.png`, `zoom-sky-list-scrollbar.png`, `mob-p-menu-open.jpg`.
- Fix: set `color-scheme: dark` on `:root` (or at least on the dialog), then `scrollbar-width: thin; scrollbar-color: <starlight-faint> transparent` on the palette list, the /sky list, the menu, /den and /playbook. Alternatively hide the bar where the list already ends on a hairline.

**3. Orange stops meaning "clean and paying".**
- Where: the carousel in the β crawl (desktop and phone), and the ε field chart at about 0.3.
- What:
  - The carousel paints DOGE −1.5% in scent orange (computed `rgb(255,138,61)`, class `text-scent`). ζ, /sky ("below zero") and /scanner show the same coin in starlight.
  - At ε 0.3 the copy is fully readable and says "orange marks the clean ones", while orange coins sit at about −4% and −28%, left of break-even. They are still gathering.
  - The Two Signals Rule is a hard rule, and this is the first data a showcase viewer sees.
- Evidence: `zoom-crawl-carousel.png`, `desk-11-sniff-enter-50.jpg` (DOM check of the DOGE colour in `misc.mjs`), `zoom-field-chart.png` / `desk-32-hedge-30.jpg`.
- Fix:
  - Use one shared predicate for orange (`clean && net > 0`, the scanner's rule) in the carousel, the radar labels and the search.
  - Finish ε's gather before the copy settles (by about 0.15 of the section), or keep coins starlight until they reach their spot.

### P2

**4. Greek letters are uppercased into Latin-looking capitals.**
- Where: γ second beat and η second beat, desktop and phone.
- What: `text-transform: uppercase` turns "β's reading" into "Β'S READING" and "in β" into "IN Β". Both read as a Latin B, which breaks the Real Glyph Rule. The η one also wraps to a lone "IN B" on phones.
- Evidence: `desk-21-spread-80.jpg`, `desk-44-embers-80.jpg`, `mob-22-spread-97.jpg`, `mob-45-embers-97.jpg`.
- Fix: wrap Bayer letters inside mono labels in a span with `text-transform: none` (a `<Bayer>` helper), cyan like everywhere else.

**5. Crawl specks land on the nav and the HUD.**
- Where: all three crawls (into β, ε and θ) at their midpoint.
- What: sparse stars are drawn on top of "SCANNER", "DEN", "SCANNER OFFLINE", "SEARCH ⌘K" and the coordinate line. The chrome looks eaten, or dirty.
- Evidence: `zoom-crawl-nav.png`, `desk-11-sniff-enter-50.jpg`, `desk-29-hedge-enter-50.jpg`, `mob-29-hedge-enter-50.jpg`.
- Fix: put the nav, the α–κ rail and the HUD above whatever layer draws the eaten-area stars (stardust or the DOM mask layer). Alternatively, exclude the nav band from that layer.

**6. The carousel double-exposes and runs on its own clock.**
- Where: β crawl, desktop.
- What: the outgoing group (BTC −20.7%, BNB −26.0%, blurred) overlaps the incoming one (TIA, ARB). The groups also swap on a timer while the page is still: OP/SEI/SUI/INJ/APT became LINK/DOGE/TIA/ARB/NEAR within 4 s with no scroll.
- Evidence: `zoom-crawl-carousel.png` (DOM overlap "−20.7% <> TIA", "−26.0% <> ARB"), the `still.mjs` log.
- Fix: run out, then in, with no overlap (stagger out to 0 before the next group rises). Ask the owner whether the swap should follow scroll progress instead of time; it isn't a twinkle or a sweep.

**7. Lines and labels collide on three instruments.**
- β radar: the inner ring strokes run through "SHORT BINANCE" and "SHORT LIGHTER", and a coin dot sits on the "B" (`zoom-radar-halves.png`, `desk-14-sniff-30.jpg`). This is the same class of problem as the crosshair P3 removed.
- κ: the smaller re-formed Canis Major keeps full-size labels. The Aludra–Wezen line cuts through "η ALUDRA", and on phones "ALUDRA" touches "ε ADHARA" (DOM overlap "ε <> Aludra") (`zoom-ledger-constellation.png`, `desk-63-ledger-97.jpg`, `mob-61..63`).
- ε field chart: labels point left into the dense cluster just right of break-even, over other coins' stars. DESIGN says they point right, away from the line (`zoom-field-labels.png`).
- Fix:
  - β: move the half captions outside the outer ring at the meridian ticks, or knock out the ring stroke behind them.
  - κ: show letters only (no proper names), or scale the label offset with the figure.
  - ε: point the labels right, and give the chart more room. It is about 330×170 px at 1440, smaller than the radar.

**8. Several instruments look empty at their own moment.**
- Where: ζ during its copy beat (desktop and phone), and the phone "instrument featured alone" beats for ε and ζ.
- What:
  - Desktop ζ at 0.3: a dashed pen with one faint speck while the copy explains it (`desk-37-kennel-30.jpg`).
  - Phone ε at 0.55: bare axes, no visible coins, no labels (`mob-33-hedge-55.jpg`).
  - Phone ζ: an empty oval (`mob-38-kennel-55.jpg`).
  - Overall, the instrument's big moment shows nothing.
- Fix: a minimum point size on phones (about 2.5 CSS px) and the top 3 labels during the featured beat. On desktop ζ, have the kennel coins settled and visible by the time the copy is readable.

**9. η's list drops a reason at a common desktop size.**
- Where: η second beat, 1440×900.
- What: the instrument says ZERO · 1, YOUNG · 1, THIN · 1, but the beat lists only Zero and Young. The "trailing rows drop out" rule removes the third reason at 900 px tall, so the list stops matching the counts above it.
- Evidence: `desk-44-embers-80.jpg` (compare `desk-42-embers-30.jpg`).
- Fix: shorten the reason lines (the first runs 3 lines), or set name chips inline so 3 rows fit at 900. If a row must drop, add "+1 more reason · see β".

**10. θ, the opening of act IV, is underpowered.**
- Where: θ, desktop and phone.
- What: about 15 faint orange specks over a whole screen. The two recap rings and the caption ("20 coins charted · η 3 skipped · Enter the sky →") are still at low opacity at 0.55 and only reach full strength near 0.8. The act opener reads as an empty sky for most of its length.
- Evidence: `desk-51-sky-55.jpg` vs `desk-52-sky-80.jpg`, `mob-51-sky-55.jpg`.
- Fix: bring the recap labels and caption in by about 0.3 and hold them. Give θ's coin points more size and contrast (brightness already encodes net APR, so scale it up, not out).

**11. /sky on phones runs labels together.**
- Where: /sky, 390.
- What: "WIF 23.1%", "SUI 28.3%" and "δ ARB / the one that stayed" stack inside about 35 px, so SUI reads as part of ARB's recap block.
- Evidence: `zoom-mob-sky-labels.png`, `mob-p-sky-top.jpg`.
- Fix: run hover/loud labels through the same collision pass as the recap labels, and drop the loud label when it would join a recap block.

**12. Under reduced motion, the β carousel overlaps the radar.**
- Where: Edition with reduced motion, β crawl.
- What: "SOL ETH BTC BNB AVAX" with their figures sits across the radar ring and "SHORT BINANCE"; the figures overprint the half caption.
- Evidence: `rm-chapter-sniff-enter.jpg`.
- Fix: under reduced motion, place the carousel in the copy column (or hide it, since the radar shows the same coins).

### P3
13. **The κ footer drops Scanner from "the nav's links".** It shows Edition · Sky · Den · Playbook (DOM confirmed). `desk-63-ledger-97.jpg`.
14. **Search keeps saying "20 coins" while showing one result** ("pe" → 1000PEPE). Make it "1 of 20". On phones the header also wraps to a lone "COSTS". `desk-p-search-typed.jpg`, `mob-p-search-typed.jpg`.
15. **LIQ DIST is 49.5% on every row** of /scanner and in every /sky reading. It is derived from the 2× setting, so the column carries no per-coin information. State it once beside the PAPER settings, or keep the column and add a note that it comes from your leverage. `desk-p-scanner-top.jpg`.
16. **α's caption "Bayer letters, after Ptolemy's Almagest" can be read as saying the Bayer letters come from the Almagest.** They come from Bayer's *Uranometria* (1603). For a site whose ornament is real-world accuracy, say "Bayer letters (Uranometria, 1603) · figure after Ptolemy's Almagest". The caption also wraps to a lone "ALMAGEST" at 1440. `desk-07-canis-55.jpg`.
17. **ε copy makes the reader count.** "The chart plots the first two… the list ranks by the first and third… so you can judge the second." Name the three tests (clears costs · held six hours · clean) and say which instrument shows which. `desk-32-hedge-30.jpg`.
18. **Playbook numbering is off-convention.** Risk-rule numbers are tiny floating digits ("1"…"7") instead of the site's 01 02 03. A roadmap numeral clipped at the nav edge shows as a half glyph. `desk-p-playbook-scroll4.jpg`, `desk-p-playbook-scroll2.jpg`.
19. **The overture-to-α stretch has no copy for a long time:** about 1,300 px on desktop and about 4 phone screens. The hound recedes, then Sirius sits alone before Canis Major forms. It is designed, but it is the longest empty run left. `desk-02`…`desk-05`, `mob-02`…`mob-06`.
20. **The /den slider labels "jumpiness / day" (15) and "scare / day" (0.10%)** have no units or explanation, and showcase viewers will stop at them. `desk-p-den-scroll2.jpg`.

## Persona red flags
- **The owner, judging in seconds:**
  - The white scrollbar in ⌘K, the specks on the nav during every crawl, and "Β'S READING" are all things they catch at once.
  - A negative coin in orange in the carousel undercuts the "orange = the hound smells something" promise.
- **A first-time showcase viewer:**
  - In the first data moment (the β crawl), the carousel shows overlapping blurred groups and an orange −1.5%.
  - ε then asks them to keep three criteria in their head.
  - θ, the act-IV opener, looks like an empty sky for most of its scroll.
  - On a phone, the first thing they see of γ, δ, ζ and ι is a ring drawn through the title.
- **A phone visitor:**
  - Titles collide with instruments (P1-1).
  - The "featured instrument" beats are empty axes and an empty pen.
  - Labels run together on /sky.

## Questions for the owner
- Should the β carousel keep swapping on a timer, or follow the scroll like everything else?
- κ's re-formed Canis Major: letters only, or letters and names at a larger scale?
- θ: make the atlas louder (bigger, brighter coin points and earlier recap labels), or keep it a quiet breath and accept that it reads as empty?

Questions skipped: run as a sub-agent, so the lead puts these to the owner. The snapshot was not persisted to `.impeccable/critique/` because this review was told not to write to the repo; the lead can persist it.
