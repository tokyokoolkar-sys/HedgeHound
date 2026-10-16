# M0 — Next.js spike

Date: 2026-10-16 · Branch: `M0-next` (from `main` @ f12556a) · Plan: [NEXTJS-MIGRATION.md](../NEXTJS-MIGRATION.md)

## What was built
- **Framework:** Next.js 16.4.2 App Router (Turbopack) replaces TanStack Start + Vite + Nitro. All five pages are ported (more than M0 asked for, because the nav shim made it cheap), and all of them prerender as static pages.
- **Shell:** `src/app/layout.tsx` (metadata, CSS) and `src/app/providers.tsx` (QueryClient, ScrollEngine, SkyHost, SiteNav, `RouteScroll`).
- **Navigation:** `src/lib/nav.tsx` keeps the TanStack shapes (`Link to/search/hash`, `useNavigate({ search: prev => … })`, `usePath`) on top of `next/navigation`. The 10 components that used the router only changed one import line.
  - A same-page query change (scanner filters, sky focus) goes through the History API. Next syncs that into `useSearchParams` with no server round trip.
  - Pages that read the query (`/sky`, `/scanner`) wrap a client route component in `<Suspense>`, so the shell still prerenders.
- **Server-side Next features:**
  - The `/api/*` proxy is a rewrite to `SCANNER_URL` (default `127.0.0.1:8000`).
  - `/universe` redirects to `/sky` and keeps the query.
  - There are `error.tsx` and `not-found.tsx` pages.
  - API base env var: `VITE_API_BASE` became `NEXT_PUBLIC_API_BASE`.
- **Dropped Grok scaffolding** (per the plan): auth, app-data, db/migrations, PWA install page, preview bridge, multiplayer, and their scripts and tests.
- **Foundation files touched** (lead-owned, hard rule 6): `"use client"` was added to `stage/sky-host.tsx`, `motion/scroll-engine.tsx` and `edition/edition.tsx`. No logic changed.

## Checks
- `next build` succeeded, `npm run typecheck` is clean, `npm run lint` is clean, and `npm test` passes 271/271.
- **Navigation in the dev server:** clicked through `/scanner → /sky → /den → /playbook → /` in the header. Every hop was a soft navigation:
  - The same `<canvas>` element stayed mounted (one canvas throughout, 0 `webglcontextlost`) and JS state survived.
  - Titles updated per page and scroll reset to the top.
- **Query and history:**
  - Scanner "clean" filter: `?status=ok` showed 16 rows, "all" showed 20, with no reload.
  - Scanner → `/sky?star=1000PEPE` focused the coin; browser Back works.
  - Clicking a coin on `/sky` sets `?star=` in place.
- **Hash and redirect:** the scanner link to `/#chapter-embers` lands where `jumpToChapter` intends (38% into the chapter). `/universe?star=btc` lands on `/sky?star=btc`.
- **Not verified:**
  - Live data: the scanner backend wasn't at `E:\ataspace\WhaleHunterAlt`, so every run used SAMPLE data and `/api` returned 500 (the same as the old Vite proxy with the scanner down).
  - Reduced motion was not exercised; the ScrollEngine code is unchanged.

## Lighthouse (production build, local, SAMPLE data, single runs, about ±10 run-to-run noise)

| Page | TanStack `main` desktop | Next M0 desktop | TanStack mobile | Next M0 mobile |
|---|---|---|---|---|
| / | 90 | 87 | 56 | 55 |
| /scanner | 94 | 83 | 83 | 62 |
| /sky | 93 | 80 | 88 | 71 |
| /den | 97 | 90 | 69 | 72 |
| /playbook | 96 | 87 | 86 | 69 |

- **Other categories** (Next): Accessibility 95–100, SEO 100, Best Practices 93–96. On `main`, Best Practices is 71–75 because of the third-party `grok.com/.../extensions.js`.
- **Performance target (>85) is not met.**
  - Desktop: 3 of 5 pages pass (/, /den, /playbook).
  - Mobile: no page passes on Next; `main` fails on / and /den too.
- **Cause:**
  - With the sky disabled (experiment build), Next scores 98–100 on desktop and 80–94 on mobile, with TBT 0–120 ms. The blocking time is almost all the WebGL sky boot: the 1 MB three/r3f/postprocessing chunk plus first render.
  - Next makes it worse than `main` in two ways. It ships about 170 KB more framework runtime. And it hydrates earlier, so the sky boot landed inside the hydration task.
  - Deferring the sky mount to idle after hydration (`AfterHydration` in providers) recovered part of the gap: desktop went from 74–83 to 80–90.
- **Tried, no gain (reverted):** `next build --webpack` and `optimizePackageImports`.

## Sky boot work (follow-up, same day)
What changed:
- **Postprocessing split out.** `Effects` (postprocessing + crawl) is `React.lazy` and mounts after the first frame. It is now its own 78 KB chunk, and the first sky chunk went from 1051 KB to 883 KB.
- **Staged mount.** `Staged` mounts the 14 scene objects one per animation frame, in the original order, so useFrame order still ends with the Projector.
- **Async compile.** `Precompile` runs `renderer.compileAsync(object, camera, scene)` once per object per frame. Hidden subtrees are made visible for their compile and then restored. The `Driver` starts drawing only after that.
- **Hound geometry in a worker.** User-timing marks showed one object, the glass hound, took about 350 ms to mount. Its `ExtrudeGeometry` (72 curve / 24 bevel segments plus normals) is now built in `objects/hound.worker.ts`:
  - The main thread parses the SVG into shapes. SVGLoader needs DOMParser, which workers lack.
  - The worker extrudes the shapes and transfers the vertex arrays back.
  - If the worker can't start, the same code runs on the main thread.

After the change:
- Shader compile is 11–25 ms per object.
- The first frame is about 90 ms.
- No mount step is over 20 ms.
- Desktop `/` went from 72 to 85–90.

Visuals were checked in the dev browser: the hero hound, γ's radar, `/sky` and `/den` match the earlier screenshots.

| Page | TanStack `main` desktop | Next before | Next after (2 runs) | Next mobile after (2 runs) |
|---|---|---|---|---|
| / | 90 | 87 | 85 / 90 | 54 / 48 |
| /scanner | 94 | 83 | 99 / 89 | 63 / 65 |
| /sky | 93 | 80 | 79 / 78 | 70 / 69 |
| /den | 97 | 90 | 98 / 99 | 72 / 70 |
| /playbook | 96 | 87 | 96 / 99 | 71 / 71 |

Desktop now meets >85 on 4 of 5 pages and is at parity with `main` except on `/sky`. Mobile is unchanged.

The mobile trace shows where the remaining blocking time goes. None of it is sky boot any more, and the first two exist on `main` too:
- **React hydration:** 1.0–1.6 s of scripting.
- **The scroll engine's per-frame GSAP ticker:** 0.7–1.1 s across the trace. It writes the stage store every frame, which re-renders its subscribers.
- **three.js evaluation:** about 0.5 s for its chunk.

On `/sky` desktop, the remaining task is a single 363 ms React task as the atlas page mounts.

## Verdict
**Go on correctness, conditional on performance.**
- Correctness: the persistent canvas, soft navigation, query state, hash landing and the redirect all work, and the port is mechanical.
- Performance: Next is about 5–10 points behind `main` on desktop. Hitting >85 everywhere needs work on the sky's boot cost. That work would help either framework.

## Open items (owner decisions)
1. **Remaining performance work.** The sky boot is done (see above). What's left:
   - `/sky` atlas mount (363 ms).
   - The per-frame store writes from the scroll ticker. Only write on change, or move subscribers to transient reads.
   - Hydration size, the main mobile cost.
2. **Is a mobile score >85 required?** `main` doesn't meet it today either.
3. **Scanner location:** confirm where it lives so the Lighthouse runs can use LIVE data.
4. **Next phases:** M1–M4 per the plan if we go ahead. The `hrefFor`/nav shim already covers M2's router migration.
