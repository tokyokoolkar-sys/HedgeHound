# Next.js migration plan

Status: proposed (2026-10-16), verified against `main` @ f12556a. Owner decision: migrate from TanStack Start (Vite + Nitro) to the Next.js App Router now, before the app grows.

## Why now
The real surface is small:
- **Routes:** 7 route files. Five are pages, one is a redirect (`/universe`) and one is the root.
- **Server:** the product has no server code of its own. The only server function (`getConnectorReadiness`) and the auth stack are Grok-sandbox scaffolding nobody uses (see "Drop").
- **Router coupling:** 11 component files import from `@tanstack/react-router`, almost all for `Link` (33 uses), `useNavigate` (6) and `useRouterState` (4).

Everything else (stage, edition, motion, scan logic, the 24 node tests) is client React or plain TS and moves unchanged.

## Current → target

| Current (TanStack Start) | Next.js target |
|---|---|
| `src/routes/__root.tsx`: `QueryClientProvider`, `ScrollEngine`, `SkyHost` (lazy-loads the one `SkyStage` canvas), `SiteNav`, skip link | `app/layout.tsx` (server: `<html>`, metadata, fonts, CSS) + `app/providers.tsx` (`"use client"`: QueryClient, ScrollEngine, SkyHost, SiteNav). The layout persists across navigations, so the canvas stays mounted once (hard rule 2). |
| Root `head()` meta, links, `theme-color`, manifest | `export const metadata` / `viewport` in `app/layout.tsx`; files stay in `public/`. |
| `head()` titles on 5 routes | `export const metadata` per `page.tsx`. |
| `import appCss from "../styles.css?url"` | `import "@/styles.css"` in the layout. |
| `index, den, playbook, scanner, sky` | `app/(…)/page.tsx`. Each is a thin server file rendering the existing client page component. |
| `validateSearch` + `Route.useSearch()` on `/sky` (hand-written regex) and `/scanner` (`parseScannerSearch`) | Page receives `searchParams` (async in Next 15+), runs the same parsers, and passes props down. No zod needed; the existing validators stay. |
| `/universe` `beforeLoad` redirect keeping `?star` | `redirects()` in `next.config.ts`, or `redirect()` in `app/universe/page.tsx`. |
| `Link to=… search={…}` (33) | `next/link` with `href` built by a small helper (`hrefFor("/sky", { star })`), so typed search stays in one place. |
| `useNavigate` (coin-search, scanner-page, sky-page) | `useRouter().push/replace` from `next/navigation`. |
| `useRouterState(s => s.location.pathname)` (site-nav, coin-search) | `usePathname()`. |
| `src/router.tsx`, `routeTree.gen.ts`, `lib/error-component.tsx` | Removed. `app/error.tsx` + `app/not-found.tsx` replace the error component. |
| Vite proxy `/api → 127.0.0.1:8000` | `rewrites()` in `next.config.ts` to `SCANNER_URL` (default `http://127.0.0.1:8000`). |
| `SkyHost` `React.lazy` + dynamic `import("gsap")`/`import("lenis")` in effects | Unchanged. They already satisfy SSR safety; add `"use client"` to the files that need it. |
| Tailwind v4 via `@tailwindcss/vite` | `@tailwindcss/postcss`; the `styles.css` `@theme` block moves as is. |
| Fontsource imports | Keep. `next/font` can be considered later. |
| Dev on `0.0.0.0:8080` | `next dev -H 0.0.0.0 -p 8080`. |
| `npm test` (node `--test`, 24 files) | Unchanged; these are pure TS. |

## Drop (Grok-sandbox scaffolding, unused by the product)
- **Vite plugins:** `authPopupPlugin`, `grokPwaPlugin`, `appEnvPlugin`, `pgliteBootstrapPlugin`, `scripts/with-app-env.mjs`, and `server/middleware/grok-pwa.ts`.
- **Auth:** `src/lib/auth/*`. It brokers OAuth to a Grok issuer, no component reads the user, and `/api/auth/*` is not mounted. `AuthProvider` comes out of the root, along with `scripts/check-auth-invariant.mjs`.
- **Other scaffolding:** `src/lib/app-data/*` (only used by the unmounted `preview-host-bridge`), `src/components/preview-host-bridge.tsx`, `src/lib/preview-path-prefix.ts`, and `src/lib/multiplayer/*` once confirmed unused.
- **Database:** `src/lib/db.ts`, `migrations/auth`, `pglite`/`kysely`/`pg`/`better-auth`. Phase 0 is paper-only with no accounts; if a DB is needed later, it gets its own decision.
- **`public/__grok/`:** remove, after replacing the apple-touch-icon with our own.
- Deleting these drops the corresponding tests from the `test` script (`app-data`, `gate-identity`, `sign-in-gate`, `preview-path-prefix`).

Log each drop in `docs/redesign/DECISIONS` / JOURNAL. If accounts come back, plan them fresh (better-auth works in Next via `app/api/auth/[...all]/route.ts`).

## Risks
- **Canvas remount.** A second layout (route groups with their own `layout.tsx`) or a key change above `providers.tsx` would recreate the WebGL context. Mitigation: one root layout, plus an M0 check that navigates across all routes and asserts there is one `<canvas>` and no `webglcontextlost`.
- **Scroll on client navigation.** `ScrollEngine` re-measures sections today from TanStack navigation timing. In Next, re-measure and refresh ScrollTrigger on `usePathname()` change, and reset scroll to top.
- **Hydration.** Next is stricter about render-time `window` reads. Fix any warnings at the source.
- **Foundation files.** `components/stage/*`, `lib/motion/*` and `styles.css` are lead-owned (hard rule 6). Edits there (mainly `"use client"` and the pathname hook) must be done or approved by the lead.
- **Uncommitted change.** `src/routeTree.gen.ts` is already modified on `main`; settle or discard it before branching.

## Phases (each a ticket on its own branch, commit prefix `v0.6`)
- **M0. Spike** (`docs/redesign/spikes/M0-next.md`): create Next in a worktree and port `providers` + `SkyHost` + `/` + `/sky`. Prove one persistent canvas across navigation, GSAP/Lenis scroll after navigation, and reduced-motion. Go/no-go here.
- **M1. Scaffold:** `next.config.ts` (rewrites, redirects), postcss/Tailwind, tsconfig `@/*` paths, eslint (`next/core-web-vitals`), and package scripts. Remove Vite, Nitro, TanStack and the "Drop" list.
- **M2. Routes:** port the remaining pages, add the `hrefFor` helper, migrate the 11 router-coupled components, and add `error.tsx`/`not-found.tsx`.
- **M3. Parity:** test, typecheck and lint green. Compare each route against `main` in the browser at 375px and desktop, and check reduced-motion. Run the Impeccable audit (PLAN §4.6).
- **M4. Deploy:** Vercel (the Nitro preset was already `vercel`). Decide where the Python scanner runs, then set `SCANNER_URL`. Write `notes/`, update CLAUDE.md commands, and tag the release.

## Done when
- Every route renders at parity with `main` @ f12556a.
- There is exactly one WebGL canvas across navigation.
- `/universe?star=X` lands on `/sky?star=X`.
- `npm test`, `typecheck` and `lint` pass.
- `next build && next start` serves it on :8080 with `/api` reaching the scanner.
