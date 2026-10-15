// The /scanner table (T31): its URL state, filters and sorting. Pure, so the URL is the only source of
// truth: a link to /scanner?status=ok&min=10&sort=held reproduces exactly what someone was looking at.
import type { ScanRow } from "./types.ts"

export type StatusFilter = "all" | "ok" | "building"
export type SortKey = "symbol" | "net" | "gross" | "held" | "n24" | "flip" | "liq"
export type SortDir = "asc" | "desc"

export type ScannerSearch = {
  status?: StatusFilter
  /** Lowest net APR (%) to show; absent = no floor. */
  min?: number
  sort?: SortKey
  dir?: SortDir
  /** A coin to point out (from the coin search or a link); always shown, even when filtered out. */
  sym?: string
}

/** The slider's range for the net floor, in %; the left end means "any". */
export const MIN_RANGE: [number, number] = [-20, 100]

const SORT_KEYS: SortKey[] = ["symbol", "net", "gross", "held", "n24", "flip", "liq"]

/** Samples in the trailing 24 h that earn `ok` (the scanner's rule). */
export const OK_SAMPLES = 144

/** Each key's natural first direction: biggest first for figures, A→Z for names, freshest flip first. */
export const firstDir = (k: SortKey): SortDir => (k === "symbol" || k === "flip" ? "asc" : "desc")

/** Read the URL's search into a clean state, dropping anything invalid and anything equal to the default. */
export function parseScannerSearch(raw: Record<string, unknown>): ScannerSearch {
  const out: ScannerSearch = {}
  if (raw.status === "ok" || raw.status === "building") out.status = raw.status
  const min = typeof raw.min === "number" ? raw.min : typeof raw.min === "string" && raw.min.trim() !== "" ? Number(raw.min) : NaN
  if (Number.isFinite(min) && min > MIN_RANGE[0]) out.min = Math.min(MIN_RANGE[1], Math.round(min))
  if (typeof raw.sort === "string" && (SORT_KEYS as string[]).includes(raw.sort) && raw.sort !== "net") out.sort = raw.sort as SortKey
  const sort = out.sort ?? "net"
  if ((raw.dir === "asc" || raw.dir === "desc") && raw.dir !== firstDir(sort)) out.dir = raw.dir
  if (typeof raw.sym === "string" && /^[A-Za-z0-9._-]{1,24}$/.test(raw.sym)) out.sym = raw.sym.toUpperCase()
  return out
}

const value: Record<Exclude<SortKey, "symbol">, (r: ScanRow) => number> = {
  net: (r) => r.net_apr,
  gross: (r) => r.gross_apr,
  held: (r) => r.persistence,
  n24: (r) => r.n24,
  flip: (r) => r.hours_since_flip,
  liq: (r) => r.liq_dist,
}

/** Filter, then sort. The pointed-out coin (`sym`) stays in even when the filters would hide it. */
export function tableRows(rows: ScanRow[], s: ScannerSearch): ScanRow[] {
  const sort = s.sort ?? "net"
  const dir = s.dir ?? firstDir(sort)
  const keep = (r: ScanRow) =>
    r.symbol === s.sym ||
    ((s.status !== "ok" || r.status === "ok") && (s.status !== "building" || r.status !== "ok") && (s.min == null || r.net_apr >= s.min))
  const sign = dir === "asc" ? 1 : -1
  const cmp =
    sort === "symbol"
      ? (a: ScanRow, b: ScanRow) => sign * a.symbol.localeCompare(b.symbol)
      : (a: ScanRow, b: ScanRow) => sign * (value[sort](a) - value[sort](b)) || a.symbol.localeCompare(b.symbol)
  return rows.filter(keep).sort(cmp)
}

/** The search after clicking a column: a new column starts in its natural direction, the same one flips. */
export function nextSort(s: ScannerSearch, k: SortKey): Pick<ScannerSearch, "sort" | "dir"> {
  const cur = s.sort ?? "net"
  const dir = cur === k ? ((s.dir ?? firstDir(cur)) === "asc" ? "desc" : "asc") : firstDir(k)
  return { sort: k === "net" ? undefined : k, dir: dir === firstDir(k) ? undefined : dir }
}

/** Percent with one decimal and a true minus. */
export const pct = (v: number) => `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`

/** Hours since the spread last changed sign; when it never did inside the window, "≥ window"; "—" under an hour of history. */
export const formatFlip = (r: Pick<ScanRow, "hours_since_flip" | "window_h">) =>
  r.window_h < 1 ? "—" : r.hours_since_flip >= r.window_h - 0.05 ? `≥ ${Math.round(r.window_h)} h` : `${r.hours_since_flip.toFixed(1)} h`

/**
 * Below an hour of five-minute samples (12) in the last six hours, the scanner's "held" share is arithmetic on
 * almost nothing (one sample reads as 100%), so the UI says "too new" instead (T42: a fresh scanner showed
 * "held 100%" everywhere).
 */
export const MIN_HELD_SAMPLES = 12
export const heldKnown = (r: Pick<ScanRow, "samples">) => r.samples >= MIN_HELD_SAMPLES
export const formatHeld = (r: Pick<ScanRow, "samples" | "persistence">) => (heldKnown(r) ? `${Math.round(r.persistence * 100)}%` : "too new")
