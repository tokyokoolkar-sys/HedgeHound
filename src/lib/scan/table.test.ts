import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { formatFlip, formatHeld, nextSort, parseScannerSearch, pct, tableRows } from "./table.ts"
import type { ScanRow } from "./types.ts"

const row = (symbol: string, net: number, ok: boolean, extra: Partial<ScanRow> = {}): ScanRow => ({
  symbol,
  gross_apr: net + 5,
  net_apr: net,
  persistence: 0.8,
  samples: 10,
  long: "Lighter",
  short: "Binance",
  liq_dist: 49.5,
  stale: false,
  avg_spread_hr: null,
  avg_apr_signed: null,
  hours_since_flip: 3,
  window_h: 24,
  n24: ok ? 144 : 20,
  status: ok ? "ok" : "building history",
  lighter_hr: null,
  binance_hr: null,
  lighter_vol24_usd: null,
  lighter_oi_usd: null,
  binance_vol24_usd: null,
  binance_oi_usd: null,
  ...extra,
})

const rows = [row("AAA", 10, true), row("BBB", 40, false), row("CCC", -5, true, { persistence: 0.2 }), row("DDD", 25, true)]

describe("scanner table", () => {
  it("reads only valid search params and drops defaults", () => {
    assert.deepEqual(parseScannerSearch({ status: "ok", min: "12.4", sort: "held", dir: "desc", sym: "pepe" }), { status: "ok", min: 12, sort: "held", sym: "PEPE" })
    assert.deepEqual(parseScannerSearch({ status: "all", min: -20, sort: "net", dir: "desc" }), {})
    assert.deepEqual(parseScannerSearch({ status: "nope", min: "x", sort: "drop", sym: "<script>" }), {})
    assert.equal(parseScannerSearch({ min: 900 }).min, 100)
  })
  it("sorts by net, biggest first, by default", () => {
    assert.deepEqual(tableRows(rows, {}).map((r) => r.symbol), ["BBB", "DDD", "AAA", "CCC"])
  })
  it("filters by status and net floor", () => {
    assert.deepEqual(tableRows(rows, { status: "ok" }).map((r) => r.symbol), ["DDD", "AAA", "CCC"])
    assert.deepEqual(tableRows(rows, { status: "building" }).map((r) => r.symbol), ["BBB"])
    assert.deepEqual(tableRows(rows, { min: 15 }).map((r) => r.symbol), ["BBB", "DDD"])
  })
  it("keeps the pointed-out coin even when filtered out", () => {
    assert.deepEqual(tableRows(rows, { status: "ok", sym: "BBB" }).map((r) => r.symbol), ["BBB", "DDD", "AAA", "CCC"])
  })
  it("sorts by other columns and flips on a second click", () => {
    assert.deepEqual(tableRows(rows, { sort: "held" }).map((r) => r.symbol), ["AAA", "BBB", "DDD", "CCC"])
    assert.deepEqual(tableRows(rows, { sort: "symbol" }).map((r) => r.symbol), ["AAA", "BBB", "CCC", "DDD"])
    assert.deepEqual(nextSort({}, "net"), { sort: undefined, dir: "asc" })
    assert.deepEqual(nextSort({ dir: "asc" }, "net"), { sort: undefined, dir: undefined })
    assert.deepEqual(nextSort({}, "symbol"), { sort: "symbol", dir: undefined })
  })
  it("formats with a true minus and an open-ended flip", () => {
    assert.equal(pct(-5.04), "−5.0%")
    assert.equal(formatFlip({ hours_since_flip: 23.9, window_h: 23.9 }), "≥ 24 h")
    assert.equal(formatFlip({ hours_since_flip: 7.46, window_h: 23.9 }), "7.5 h")
    assert.equal(formatFlip({ hours_since_flip: 0, window_h: 0 }), "—")
  })
  it("says a coin is too new before it has an hour of samples", () => {
    assert.equal(formatHeld({ samples: 1, persistence: 1 }), "too new")
    assert.equal(formatHeld({ samples: 48, persistence: 0.42 }), "42%")
  })
})
