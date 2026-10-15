# P4 close: legacy deleted, full critique, fixes, v0.5

Branch `P4-close`. Owner approved a–d (subagents fine) and picked the full recommended batch: A, B and C1–C11; the carousel follows the scroll; κ shows Greek letters only on phones; θ a little louder.

## a–b. The legacy site, deleted
- `/v1` (hero-film, tear, the old hub and sniff scenes), `/_kitchen`, `/_motion`, `/_stage`, `magicui/*`, the unused shadcn `ui/*`, `lib/ui.ts`, `logos-carousel.tsx`.
- The v1 palette and legacy CSS (`.night`, `.paper`, dropcap, marquee, drift, meteor/orbit/ripple), the v1 entries in `palette.ts`, dead sample code in `lib/scent.ts`, 26 unused packages. 4,667 lines.
- Kept: `text-fx/*` (the owner's kit, JOURNAL #29). Left alone: the Grok template's plumbing (JOURNAL #28).

## c. The critique
Two subagents, merged into one ranked report (https://claude.ai/artifact/WgJPG2wCNsghrZ9GrkC4Ki):
- Design review: 19/28 (P3 18/28; 28/40 on all ten heuristics). `P4-close-design-report.md`.
- Technical audit: 15/20 (Good). `P4-close-tech-report.md`.
Nothing blocked a task; console and overflow clean; contrast AA on settled text.

## d. Fixed
- A1 phones: a rising chapter's instrument waits until its copy settles (`rhythm.arrival(…, stacked)`).
- A2/C11 reduced motion: Canis Major, the carousel and the radar get their own slots; departing instruments leave when their chapter ends (`departure(…, reduced)`).
- A3 sliders named on the thumb. A5 dark colour scheme and one thin faint scrollbar everywhere.
- A4 orange is clean and paying everywhere (carousel predicate); ε coins stay starlight until they land and settle before the body is readable.
- B1 notes in sentence case with Greek in its own case and colour (`edition/greek.tsx`). B2 crawl stars kept out of the nav and coordinate bands.
- B3 carousel scroll-locked, groups never overlap (`choreo.groupItem`, tested). B4 word blur capped at BODY_BLUR (tested).
- B5 nav reserves the status's room (no shift on load). B6 dialogs return focus (`nav/use-opener.ts`); menu has `aria-expanded`.
- B7 radar halves named above the ring; κ letters only on phones, Aludra's name to the left on wide; ε labels point right.
- B8 ζ settles before its copy; phone ε/ζ featured beats gather while they grow. B9 θ pull-back by 0.28, labels after, coins a little louder.
- B10 shorter ember reasons (all three fit at 1440×900). B11 /sky names give way to recap labels. B12 forced-colours fallbacks. B13 ledger shares the nav's links (`nav/links.ts`), footer landmark named.
- C1 search "1 of 20". C2 liq dist says it follows the leverage. C3 "Bayer letters (Uranometria)". C4 ε names its three tests. C5 playbook rules numbered 01–07. C6 what-if units explained. C7 /sky reading after the list in tab order, "esc" hidden on touch. C8 skip link, padded rail letters. C9 long notes in sentence case. C10 our own manifest ("HedgeHound", void colours), shimmer colour variants removed.
- Moved: C12 (designed) and C13–C14 (idle frames, bundle size) to JOURNAL #30, #31.

## Checks
- `npm test` 446 pass; typecheck clean; lint only the pre-existing `no-empty`; detector: only the unused text-fx kit and template auth HTML.
- Headed Chromium 1440, 1024, 768, 390, reduced motion, forced colours: no console errors beyond the scanner-off 502; nav still after load; focus returns to the search and menu buttons.

Shots: `P4-close-shots/`.
