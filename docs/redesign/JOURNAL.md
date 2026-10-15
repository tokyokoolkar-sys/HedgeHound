# Open items journal

Everything still open from finished tickets, in one place. Each ticket's notes keep their own "Open" section; this file carries the items forward until they're closed. When a ticket ends: add its new open items here, and move anything it closed to **Closed** with the ticket that closed it.

Status: **open** (needs work), **owner** (waiting on an owner decision), **later** (has a home ticket, not urgent).

## Open

| # | Item | From | Home | Status |
|---|---|---|---|---|
| 1 | Glass hound silhouette is still the draft mark from S4; needs proper art. | T12, T14, T15 | — | open |
| 3 | First-time viewers: "spread" is defined in γ, but β already uses the word. | T15 critique | — | open |
| 4 | Very short phones (≤ 667 px tall) aren't tuned: on β the reading can meet the HUD. | T15 | T52 | later |
| 5 | Real iPhone and real GPU check (PerformanceMonitor tiers, Lenis touch). | T12 | T52 | later |
| 7 | The carousel cycles every 2.2 s but is only on screen for ~820 px of scroll, so the owner sees 1–2 of 6 groups. Owner-chosen ambient cycle. | T15 critique | — | owner |
| 8 | PRODUCT.md "Brand Commitments" still describes the retired parchment / Bricolage direction (Impeccable reports it as drift). | T15 critique | T51 or on request | later |
| 9 | Legacy cleanup: `text-faint` (4.2:1) in `/_kitchen`, hex literals in `.night` / `.paper`, the `/v1` route and its components (hero-film, tear, old scenes), throwaway check routes `/_kitchen`, `/_motion`, `/_stage`. | T10, T13 | T51, T52 | later |
| 10 | Pre-existing lint error: empty block in `src/lib/app-data/client.server.ts:281`. | T00 | T51 | later |
| 11 | γ reuses the β layout box, which keeps room on the right for a reading γ doesn't have; the astrolabe could be larger on wide screens. | T20 | — | open |
| 12 | Under reduced motion there is no price swing, only its caption, so "price cancels" is told rather than shown. | T20 | — | owner |
| 13 | δ's trail shows only what live fields allow (window, last flip, 6 h persistence); the real shape of the day needs `/api/history`. | T21 | T41 (needs owner OK) | owner |
| 14 | When the sign flipped very recently (sample: 1.4 h), the solid part of the trail is a tiny stub at the `now` end, so the comet reads mostly dashed. Honest, but quiet. | T21 | — | open |
| 16 | In the sample most coins sit at 100% held, so ε's stars bunch along the top edge; live data may spread them. Revisit with LIVE data. | T22 | — | open |
| 17 | The kennel list is editorial and fixed; new meme listings need adding by hand. | T23 | — | later |
| 18 | SAMPLE has only three skipped coins, so η looks sparse offline; checked with a long-list mock (`T24-shots/mock-long-lists.png`). Re-check with LIVE. | T24 | — | open |
| 20 | With SAMPLE's twenty coins the atlas is a quiet field; it fills out with LIVE. | T25 | — | open |
| 22 | Paper results: Phase 0 records no paper trades, so ι shows settings and a live count only. Revisit if a paper book of trades is ever built. | T26 | — | owner |
| 24 | δ's strips colour by short venue (orange = short on Lighter) while orange means "clean" elsewhere; reads as "ARB alerts". | P3 critique | — | open |
| 28 | The Grok template's plumbing (`lib/auth`, `lib/app-data`, `lib/db`, `lib/multiplayer`, the preview bridge, pglite in vite.config) is unreachable from the routes but may be wired outside them; removing it is its own decision. | P4 close | — | owner |
| 29 | `components/text-fx/*` (blur reveal, shimmer, gradient wave, perspective text) is kept as the owner's kit but nothing uses it yet. | P4 close | — | open |
| 30 | The overture → α stretch is the longest run without words (about four phone screens). Designed; revisit only if it reads as empty. | P4 critique (C12) | — | owner |
| 31 | The sky redraws every frame even when nothing moves; skip frames when idle. Also measure the production bundle once (`vite build` with a size report). | P4 critique (C13, C14) | P6 | later |

## Decided, kept for reference
- ε lists by net and clean status and marks "shaky" (held under half of six hours); no persistence threshold is invented (owner, P3 close).
- The Edition ends on Canis Major re-forming around Sirius (owner, P3 close).
- β reading stays mid-chapter, not as the chapter's ending (owner, T15).
- The α–κ index stays Greek letters (not a tiny Canis Major) (owner, T15).
- Radar axes: half = short venue, radius = signed net APR (owner, T15).

## Closed

| Item | Closed by |
|---|---|
| #2 `/den` dollar columns and figures in tabular digits | T34 |
| #21 "Open the den" under ι's book | T34 |
| #27 `/den` asks for the quiet sky | T34 |
| #19 θ's "Enter the sky" without a canvas remount | T33 |
| #15 "Open scanner" under ε's shortlist | T31 |
| #6, #26 Phones had no chapter index or position cue | T30 (the phone menu lists α–κ, lights the current chapter, and jumps to it) |
| Legacy `/` swash initial ("I t does not chase price") | T14 (`/` is the Edition; legacy moved to `/v1`) |
| α copy rise timing after the constellation | T14 |
| Carousel, radar and reading via ProjectedLabel + Stardust | T14, T15 |
| β copy barely visible during the crawl rebuild | T15 (radar in the β scene) |
| "Spread" never defined | T20 (γ's opening sentence) |
| The "1000" prefix in 1000PEPE never explained | T23 (ζ's footer, shown when a prefixed kennel coin is on the list) |
| Second beats could run under the HUD on 768 px tall screens | T23 (Beat fits the viewport) |
| One template, one crawl (#23) | D2 (four acts, crawls between acts, travelling coins) |
| 1000PEPE leading five chapters (#25) | D2 (it is now the deliberate thread of act II, flying instrument to instrument; θ names ARB "the one that stayed") |
| Scent orange rendered red on point instruments; dark shimmer band; clipped descenders (again); radar lines through labels; ε label overlap; ε copy vs list contradiction; phone beats flashing by; captions clipped at phone edges; η heads bunching; κ duplicate coordinate; vignette contour | P3 close |
| Shimmer titles clipped descenders; α pop at the crawl hand-off; β fog; radar collisions at 1024–1366 px; SourceTag and index contrast; hound base line | T15 (critique fixes) |
