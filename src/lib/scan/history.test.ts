import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import { hourlyApr, normalizeHistory, venueSpreadApr } from "./history.ts"
import { normalizeScan } from "./normalize.ts"

const read = (f: string) => JSON.parse(readFileSync(new URL(`./__fixtures__/${f}`, import.meta.url), "utf8"))

describe("scanner history (T41)", () => {
  it("parses the recorded history: ms timestamps, oldest first", () => {
    const pts = normalizeHistory(read("history.json"))
    assert.ok(pts && pts.length > 0)
    assert.ok(pts![0].ts > 1e12)
    for (let i = 1; i < pts!.length; i++) assert.ok(pts![i].ts >= pts![i - 1].ts)
  })
  it("rejects what isn't a history and drops broken points", () => {
    assert.equal(normalizeHistory({ rows: [] }), null)
    assert.deepEqual(normalizeHistory({ points: [{ ts: 1, l: 0.1, b: "x", spread_apr: 3 }] }), [])
  })
  it("reads the per-venue fields from the recorded live scan", () => {
    const scan = normalizeScan(read("scan-live.json"))!
    const r = scan.rows[0]
    assert.equal(typeof r.lighter_hr, "number")
    assert.equal(typeof r.binance_hr, "number")
    const spread = venueSpreadApr(r)!
    assert.ok(Math.abs(Math.abs(spread) - r.gross_apr) < Math.max(5, r.gross_apr * 0.6), "spread ≈ gross on a fresh run")
  })
  it("an older scanner (no per-venue fields) leaves them null", () => {
    const scan = normalizeScan(read("scan.json"))!
    assert.equal(scan.rows[0].lighter_hr, null)
    assert.equal(venueSpreadApr(scan.rows[0]), null)
  })
  it("formats an hourly rate as APR with a true minus", () => {
    assert.equal(hourlyApr(-4.17e-6), "−3.7%")
    assert.equal(hourlyApr(0.000359), "314.5%")
  })
})
