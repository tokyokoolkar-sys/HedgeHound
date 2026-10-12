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
- Intended command: `npm run dev` (runs `scripts/with-app-env.mjs`, which merges `.grok/app-env.json`, i.e. `VITE_AUTH_ENABLED=false`).
- **Current status: `npm run dev` fails on Windows** with `spawn vite ENOENT`. See `docs/redesign/notes/T00.md`. Until the owner approves a wrapper fix, run the same server directly (PowerShell):
  ```powershell
  cd E:\ataspace\BuiltwGrok\HedgeHound
  $env:VITE_AUTH_ENABLED = "false"
  node node_modules\vite\bin\vite.js dev --host 0.0.0.0 --port 8080 --strictPort
  ```
  Git Bash equivalent: `VITE_AUTH_ENABLED=false node node_modules/vite/bin/vite.js dev --host 0.0.0.0 --port 8080 --strictPort`
- Routes to check: `/`, `/universe`, `/den` (all 200).
- `/api/scan` on `:8080` returns 404 until T01 adds the dev proxy to `vite.config.ts`. After T01 it must return the same JSON as `:8000`.
- Stop with Ctrl+C in its terminal.

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
