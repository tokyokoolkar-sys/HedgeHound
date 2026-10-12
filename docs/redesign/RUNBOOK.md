# HedgeHound runbook (Windows 11)

Two servers, one browser. Start the scanner first, then the app.

| Piece | Command | Port | Verify |
|---|---|---|---|
| Scanner (Python, stdlib) | `python E:\ataspace\WhaleHunterAlt\scanner\server.py` | `127.0.0.1:8000` | `curl http://127.0.0.1:8000/api/scan` returns JSON with `rows`, `err`, `ts`, `meta` |
| App (Vite + TanStack Start) | see "App" below | `0.0.0.0:8080` (strict) | `curl http://localhost:8080/` returns 200 |
| Preview (Vite preview, not used in P0) | `npm run preview` | `127.0.0.1:8081` | n/a |

## Scanner
- Run from anywhere; it resolves `samples.db` and `static/` next to `server.py`.
- It polls the exchanges every 300 s (`POLL = 300`). The first poll takes a few seconds after start.
- It writes `samples.db` in `WhaleHunterAlt\scanner\`. This is normal operation.
- Stop with Ctrl+C in its terminal.

## App
- Command: `npm run dev`. It runs `scripts/with-app-env.mjs`, which merges `.grok/app-env.json` (`VITE_AUTH_ENABLED=false`) into the environment, then starts `node node_modules/vite/bin/vite.js dev --host 0.0.0.0 --port 8080 --strictPort`.
- Windows: works since T00 (package.json runs vite through `node node_modules/vite/bin/vite.js`, so no shell is needed; wrapper file unchanged).
- Check the env reached Vite: `curl http://localhost:8080/__app-env` returns `{"VITE_AUTH_ENABLED":"false",...}`.
- Routes to check: `/`, `/universe`, `/den` (all 200).
- `/api/scan` on `:8080` is proxied to `:8000` (vite.config.ts, T01). It returns the same JSON as `:8000`.
- Stop with Ctrl+C in its terminal.
- `npm run build` and `npm run preview` now go through the same wrapper, but neither has been run since the change.

## LIVE vs SAMPLE
- Today the UI shows only a static sample (`src/lib/scent.ts`). Nothing reads the scanner yet, so there is no LIVE view until T40. The labels are added in T13 (`SourceTag`).
- To check whether the scanner is returning live data, read `/api/scan`:
  - **LIVE**: HTTP 200, `ts` is a Unix timestamp greater than 0, `err` is `null`, `rows` is non-empty.
  - **Not live**: connection refused on `:8000`, or `ts` is `0` (no poll has finished yet), or `err` is a string (the last poll failed; the string is the error).
- Anything shown while not live must carry a SAMPLE tag. The rule is in `PRODUCT.md` and `docs/redesign/PLAN.md` §6.

## Quick check (both servers up)
```
curl http://127.0.0.1:8000/api/scan   -> JSON, 200
curl http://localhost:8080/           -> 200
curl http://localhost:8080/universe   -> 200
curl http://localhost:8080/den        -> 200
curl http://localhost:8080/api/scan   -> 404 until T01, then equal to :8000
```

## Checks
- `npm run typecheck`
- `npm run lint`
