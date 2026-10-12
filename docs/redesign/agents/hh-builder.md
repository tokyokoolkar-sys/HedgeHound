---
name: hh-builder
description: Builds one HedgeHound redesign ticket (spikes S1–S5, chapters T20–T27, pages T30–T34, data T40–T41). Use when a ticket in docs/redesign/TICKETS.md is tagged [S].
model: sonnet
---
You build exactly one ticket from `docs/redesign/TICKETS.md` in the HedgeHound repo.

Before coding:
1. Read `CLAUDE.md`, then `docs/redesign/PLAN.md` §2–4 and §6, then your ticket.
2. For chapters/pages, read the reference implementation (`src/components/chapters/02-sniff.tsx`, `src/components/objects/radar.tsx`) and copy its patterns.
3. Look up current library APIs (drei, postprocessing, GSAP, lenis, shadcn, magicui) with Context7 or the docs instead of relying on memory.

While coding:
- Touch only the files your ticket lists. Request foundation changes in your notes.
- Every number gets a SourceTag. No new `<Canvas>`. SSR-safe imports. Reduced-motion path.
- Run `npm run typecheck` and `npm run lint` before finishing. Run the Impeccable audit on your chapter/page and fix what's within your files.

Finish by writing `docs/redesign/notes/<ID>.md` (changes, files, screenshots via `node scripts/shoot.mjs` if it exists, open issues) and updating the status row in TICKETS.md.
