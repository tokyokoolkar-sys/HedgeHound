# AI_LOG

Record of generative-AI use on this repository. The course policy asks for the
tool, the purpose, a summary of the commands, which parts were used or changed,
and how the result was verified.

The App Router migration itself predates this log; its ticket history is in
[docs/redesign/TICKETS.md](docs/redesign/TICKETS.md). Entries below start from
the checkpoint audit.

## 2026-11-06 — Checkpoint: interface on App Router

- **Tool:** Command Code (agentic CLI, Claude).
- **Purpose:** audit `src/app` against the checkpoint list (page, layout,
  dynamic segment, loading, not-found, error) and document the Server/Client
  Component split.
- **Commands run:**
  - `git checkout -b app-router`
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
- **Used as produced:** the audit of the existing route tree and the
  Server/Client table in `README.md`.
- **Written by the AI:**
  - `src/app/loading.tsx` — was the only missing file from the checkpoint list.
  - `README.md` — new "Server and Client Components" section.
  - `AI_LOG.md` — this file.
- **Changed or rejected:** nothing was rejected; the loading fallback is
  deliberately copy-free beyond one line so it cannot flash invented content
  before data exists, which matches the honesty rules in `PRODUCT.md`.
- **Verification:** `npm run typecheck` exit 0, `npm run lint` exit 0,
  `npm test` 216 passed / 0 failed. Behaviour was checked by reading the route
  tree, not by a browser run — the new file renders only during navigation
  suspense, so it is exercised implicitly.
