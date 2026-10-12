# HedgeHound roadmap

Versions follow the build phases: each phase ends with a git tag. Detail per ticket lives in [redesign/TICKETS.md](redesign/TICKETS.md); the plan is [redesign/PLAN.md](redesign/PLAN.md); the look is [../DESIGN.md](../DESIGN.md).

## Where we are (2026-10-13)

**v0.3: Foundation, about to start.** The visual direction ("Almagest": a real night sky, scroll-locked transitions) was set on a live prototype and written down in DESIGN.md. The production build of it starts next.

## Done

### v0.1: Groundwork ✓ (tag `v0.1`)
- Git baseline. The project runs on Windows (`npm run dev`).
- The dev server proxies `/api` to the local scanner.
- Dependencies are installed: 3D, scroll, motion and fonts.
- shadcn/ui and magicui components, plus text effects.
- The Impeccable design skill is installed and PRODUCT.md written.
- Test suite running (289 tests).

### v0.2: Spikes + live data ✓ (tag `v0.2`)
- **S1:** one persistent 3D canvas works under server rendering.
- **S5:** a smooth scroll stack with no jank.
- **S2–S4:** nebula, glass panels and a liquid-metal mark. All three were later superseded by the new direction.
- **Live data layer (T40/T40b):**
  - scanner fetch with a labelled SAMPLE fallback
  - LIVE / PAPER / SAMPLE tags on every figure
  - stale readings marked
  - offline back-off
  - copy fixed so nothing reads as a yield claim

### Direction prototype D1 "Almagest" ✓ (branch `D1-almagest`, route `/_almagest`)
- Glass hound → Canis Major (real star positions) → pixel-"bite" transition → radar.
- Three rounds of owner feedback settled these choices:
  - dither grain
  - Noto Serif Display
  - no bloom, no cards
  - motion locked to the scroll
  - readings that gather out of star specks
- Written up as DESIGN.md, with PLAN and TICKETS rescoped to match.

## Next

### v0.3: Foundation (lead builds)
Build the real site on the prototype's proven code:
- **T10** colours and type from DESIGN.md
- **T11** smooth scroll and scroll-progress engine
- **T12** the sky stage: stars, glass hound, Canis Major, the bite transition
- **T13** building blocks: chapter, shimmer titles, rise, stardust text, projected labels, the symbol carousel
- **T14** Overture + α Canis Major
- **T15** β Sniff with the radar, the reference every other chapter copies

The phase ends with a design critique and tag `v0.3`.

### v0.4: Chapters γ–κ
One Coin Two Legs · The Trail · The Hedge · The Kennel · Cold Embers · The Sky · The Den · Ledger. These are built in parallel, one branch each, all following the reference chapter.

### v0.5: Pages
- Site navigation.
- `/scanner`: the full sortable live table.
- `/sky`: every coin charted.
- `/den`: the paper desk.
- `/playbook`: rules and method.
- Optional demo gate.

### v0.6: Data
- Live data everywhere.
- **Waiting on the owner's OK:** two small read-only additions to the scanner. A 24-hour history endpoint, plus per-venue rates, volume and open interest. Until then, trails and per-venue numbers stay SAMPLE or hidden.

### v1.0: QA & polish
- Screenshot and console checks on every route at desktop and phone sizes, with and without reduced motion.
- Performance budget per device tier.
- Accessibility pass.
- An honesty sweep: every number tagged.
- A check on a real iPhone.
- A final design critique and polish against DESIGN.md.

## Not in scope (Phase 0)
- Placing orders, exchange keys, or any code that could trade.
- Invented yields, returns, testimonials or a track record.
- Public hosting. HedgeHound runs locally on the owner's machine.
