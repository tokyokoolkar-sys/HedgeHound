# P3 close: full critique and fixes

Branch `P3-close`. Dual-agent Impeccable critique of the whole Edition (overture → κ): 18/28, snapshot `.impeccable/critique/2026-10-14T10-59-22Z__src-components-edition-edition-tsx.md` (P2 was 17/28). Owner chose: fix bugs + overlaps now (rhythm rework is its own round), ε reworded with "shaky" marks, end on Canis Major.

## Fixed
- **Scent orange rendered red** on every point instrument: `SKY_COLORS` are already linear (three's colour management) and shaders applied `pow(2.2)` to the colour again. Now only the falloff gets the curve (`star-points.ts`, all `objects/*`). The radar sweep's cyan was darkened the same way. The glass keeps its tuned curve.
- **Shimmer**: the upstream `dark:` black contrast is removed (this site's `dark` variant always applies), so the sweep is a white glint; the size class sits on the shimmer wrapper so its em padding clears descenders (HedgeHound, The Hedge, The Sky, Paper only.); under reduced motion titles are plain starlight.
- **β radar**: no crosshair (lines ran through labels); short meridian ticks mark the left/right division.
- **ε**: copy now says what the list ranks (net and clean) and leaves "held" to the reader; rows that held under half of six hours say "shaky". Labels are side-aware (ARB/TIA overlap gone). "break-even" no longer splits.
- **Phones (stacked)**: instruments take over only after the copy has left (0.53), captions wait until the instrument has finished growing, the second beat arrives at 0.78 and holds to 0.97 (was 0.82 → 0.96); long captions wrap their tag instead of running off the edge; η's stream heads fade before the field recedes.
- **κ**: the sky dims and Canis Major re-forms around Sirius as the last image (the lone-star label and its duplicate coordinate are gone); copy and footer re-spaced (links and the way back on one row) so nothing meets at 1024×768.
- **η**: the reason lines are serif body text like the other beats.
- **Vignette removed**: darkening the near-black void left a one-level oval contour no grain could dither.

## Checks
- `npm test` 400 pass; typecheck clean; lint only the pre-existing `no-empty`; detector clean.
- Headed Chromium 1440, 1024×768, 390, reduced motion: no console errors beyond the scanner-off 502 / THREE.Clock; no horizontal scroll.

## Carried to the journal
Rhythm (one template, one crawl) → its own prototype round; δ strip colours; 1000PEPE leading five chapters; no phone index.
