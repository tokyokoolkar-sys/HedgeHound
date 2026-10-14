# D2: the rhythm round (prototype)

Branch `D2-rhythm` (not merged). The answer to journal #23/#25 and the P3 critique's issue 3: γ–ι shared one template and the bite crawl appeared once in ~42 screens. Scroll `/` and flip the switches in the bottom-right panel (also in the URL, e.g. `/?seams=acts&handover=travel&pace=varied`).

## Switches
- **seams**: `rise` (P3: a crawl only into β) · `acts` (crawls into β, ε, θ, the starts of acts II–IV) · `every` (a crawl into every chapter β–ι).
- **handover** (inside an act): `recede` (P3: into depth, empty sky between) · `fade` (in place, no gap) · `travel` (in place, and the coins fly across: β→γ→δ the loudest scent, ε→ζ the kennel coins, θ→ι what clears your bar; wide layouts only).
- **pace**: `uniform` · `varied` (δ and η 320svh instead of 440 while their live data is thin).

Default (the recommendation): `acts` · `travel` · `varied`. `rise · recede · uniform` reproduces P3 exactly.

## How it works
- `lib/stage/rhythm.ts`: the switches, `chaptersFor()` (which chapters enter by a crawl and how long each runs), `arrival()` / `departure()` (an instrument entered by a crawl is there from the crawl's midpoint; one before a crawl holds until the bites eat it; fade/travel hand over in place at the very end). Tested.
- `lib/stage/travel.ts` + `objects/travelers.tsx`: seam progress (lift-off over the last 14% of a chapter, landing over the first 20% of the next), the flight path with a small rise and a short tail. Tested.
- Every scene uses `arrival`/`departure`; instruments fly in and out of depth only for `recede`.
- Copy: a chapter with a second beat leaves on time even before a crawl (fixed a pop-back found on phones). θ's recap now says "the one that stayed" for the steadiest coin.

## Checks
- `npm test` 411 pass; typecheck clean; lint only the pre-existing `no-empty`.
- Headed Chromium 1440, 390, reduced motion on the default and on `every·fade·uniform` and `rise·recede·uniform`: no console errors beyond the scanner-off 502 / THREE.Clock; no horizontal scroll.

## After the owner picks
Remove the panel and the URL switches, collapse `rhythm.ts` to the chosen settings, write the result into DESIGN.md and PLAN §3, update the journal.
