// Where the figures come from, in words (κ's ledger and anywhere a sentence beats a tag). Pure.
export type SourceState = { live: boolean; stale: boolean; loading?: boolean }

/** One line for the ledger: scanner live, live but stale, offline (sample), or still asking. */
export function sourceLine(s: SourceState): string {
  if (s.loading) return "asking the scanner"
  if (!s.live) return "scanner offline · showing a sample"
  return s.stale ? "scanner live · last poll older than five minutes" : "scanner live"
}

/** Where the scanner runs; the app reaches it through the dev proxy, never directly. */
export const SCANNER_ADDRESS = "127.0.0.1:8000 · reached through /api"
