# HedgeHound

A front end for a local funding-rate spread scanner (Lighter × Binance Futures). Phase 0: **paper only, no order code, ever**.
Being redesigned as "The Can✶s Edition": a funding-spread observatory in a real night sky, long-scroll. **Before any UI work read `DESIGN.md` (start with "The owner's taste": the site follows the owner's taste) and `docs/redesign/PLAN.md`.** Tickets: `docs/redesign/TICKETS.md`. Prototype of record: `/_almagest` on branch `D1-almagest`.

## Run
- App: `npm run dev` → http://localhost:8080 (Next.js 16 App Router). Production: `npm run build && npm start`.
- Routes: `/`, `/scanner` (filters in the query), `/den`, `/playbook`, `/sky` and `/sky/[STAR]` (the coin in focus; build links with `skyPath()` from `lib/sky-path.ts`). `src/proxy.ts` redirects the old `/sky?star=` and `/universe` addresses.
- Scanner backend: `python E:\ataspace\WhaleHunterAlt\scanner\server.py` → http://localhost:8000/api/scan (`/api` is rewritten to `SCANNER_URL`, default `127.0.0.1:8000`).
- Checks: `npm run typecheck`, `npm run lint`, `npm test`.
- DB (Phase 0 paper only): `npm run db:generate`, `npm run db:migrate`. Prisma + Postgres via DATABASE_URL (see .env.example).

## Hard rules
1. **Data honesty** (from PRODUCT.md): never invent APRs, yields or performance claims. Every on-screen number shows a `<SourceTag>` (LIVE / PAPER / SAMPLE).
2. **One WebGL canvas** (`components/stage/sky-stage.tsx`), mounted once by `app/providers.tsx` (root layout). Never key or wrap it in a route-group layout. Section 3D goes through drei `<View>`. No new `<Canvas>` without a spike decision in `docs/redesign/spikes/`.
3. **SSR-safe:** no `window`/`document`/three/gsap at module top level in route or shared files. Use `"use client"` plus a dynamic import in an effect, `React.lazy`, or `next/dynamic` with `ssr: false`. Keep pages static unless they need the request: data comes from the client scan query, not server fetches.
4. **GSAP owns scroll-linked motion; `motion` owns micro-interactions.** Never both on one element. Respect `prefers-reduced-motion`.
5. **Tokens only** (`DESIGN.md`, PLAN §2.2). Hex literals live only in `src/lib/palette.ts` and the `@theme` block of `styles.css`. Scent orange = alerts/short leg, scan cyan = scanning/long leg/focus; never decorative. No bloom, no cards behind copy, transitions scroll-locked.
6. Foundation files (`styles.css`, `lib/stage/*`, `lib/motion/*`, `components/edition/*`, `components/stage/*`) are owned by the lead. Builders request changes in their ticket notes and don't edit them.
7. Work on a branch or worktree per ticket. Write `docs/redesign/notes/<ticket>.md` when done, and carry its open items into `docs/redesign/JOURNAL.md` (move closed ones to its Closed table).
8. **Commit messages start with the phase version**: v0.1 = P0, v0.2 = P1, v0.3 = P2, v0.4 = P3, v0.5 = P4, v0.6 = P5, v1.0 = P6. Example: `v0.2 S1: persistent canvas spike`. Each phase end gets an annotated tag. Current phase: **v0.6**.

## Design skill
Impeccable is the design skill for this repo. Run its critique/audit on your work before handing in (PLAN §4.6).
