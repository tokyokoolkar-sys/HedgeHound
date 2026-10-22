# HedgeHound runbook (Windows 11)

Two servers, one browser. Start the scanner first, then the app.

| Piece | Command | Port | Verify |
|---|---|---|---|
| Scanner (Python, stdlib) | `python E:\ataspace\WhaleHunterAlt\scanner\server.py` | `127.0.0.1:8000` | `curl http://127.0.0.1:8000/api/scan` returns JSON with `rows`, `err`, `ts`, `meta` |
| App (Next.js) | see "App" below | `0.0.0.0:8080` | `curl http://localhost:8080/` returns 200 |

## Scanner
- Run from anywhere; it resolves `samples.db` and `static/` next to `server.py`.
- It polls the exchanges every 300 s (`POLL = 300`). The first poll takes a few seconds after start.
- It writes `samples.db` in `WhaleHunterAlt\scanner\`. This is normal operation.
- Stop with Ctrl+C in its terminal.

## App
- Dev: `npm run dev` (`next dev -H 0.0.0.0 -p 8080`). Production: `npm run build && npm start` (port 8080).
- Routes to check: `/`, `/scanner`, `/sky`, `/sky/BTC`, `/den`, `/playbook` (all 200). `/universe?star=btc` and `/sky?star=btc` redirect to `/sky/BTC`.
- `/api/*` on `:8080` is rewritten to `SCANNER_URL` (default `http://127.0.0.1:8000`, next.config.ts). With the scanner down it returns 500 and the UI shows SAMPLE.
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

## Impeccable (design skill + hook)
- Skill: `.claude/skills/impeccable/` from `pbakaus/impeccable@c63b8dd7dd5a5f3c32eaabe1af76d0694f863ed2` (engine 0.1.14).
- Engine binary: downloaded once by the launcher and SHA-256 verified, cached at `%USERPROFILE%\.impeccable\bin\0.1.14\impeccable.exe` (sha256 `38e09451694973ba664a24e67e1502a6913e6d0e533a0a5ae1e04c5963a804b1`). A fresh machine fetches it on first run.
- Boot check: `.claude/skills/impeccable/scripts/impeccable context`
- Hook: after every Edit/Write on a UI file it runs the detector and adds a short note. At Stop it runs a full deep pass. Quiet mode is on, so clean files say nothing.
  - Status: `.claude/skills/impeccable/scripts/impeccable hooks status`
  - Off/on: `… hooks off` / `… hooks on`
  - Shared config: `.impeccable/config.json` (committed). Machine-local: `.claude/settings.local.json` (hook manifest) and `.impeccable/config.local.json`, both ignored.
- Exceptions: record one only for something the owner approved, e.g. `… hooks ignore-value overused-font Inter --reason "user confirmed: vega preset"`. Never add one just to silence a real issue.
