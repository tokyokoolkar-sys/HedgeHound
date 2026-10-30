# db-scan-history

Added Prisma models for recording every coin of every live scan, plus a watchlist and paper trade outcomes.

## What changed
- `prisma/schema.prisma`: Scan, ScanCoin, WatchlistItem, PaperOutcome, ScanCoinStatus, PaperOutcomeStatus. PaperTicket gained an `outcome` relation.
- `src/lib/scan/record.ts`: pure recorder helpers (`toScanRecord`, `pollAndRecord`).
- `src/lib/scan/record-job.ts`: server-only job polling every 60s, guarded by globalThis.
- `src/instrumentation.ts`: starts job under nodejs runtime.
- `src/lib/scan/record.test.ts`: tests.

## Decisions
- Recorder uses DEFAULT_SCAN_PARAMS with min:0 so the filter doesn't hide coins from the recorded universe.
- A scanner that is off is silent (pollAndRecord never throws; record-job swallows P2002 and other errors).
- Duplicate scannerTs treated as no-op (P2002).

## Open items
- PaperOutcome result fields computed later from real recorded data (no code yet).