import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { STREAM_X, cleanSymbol, emberAt, moreThan, placeEmbers, skippedLists } from "./embers.ts"
import { INSTRUMENT_EXTENT } from "./layout.ts"

const meta = {
  skipped_zero: ["BOT"],
  skipped_young: ["H100", "NEWX(status=SETTLING)"],
  skipped_thin: Array.from({ length: 30 }, (_, i) => `T${i}`),
}

describe("cold embers", () => {
  it("cleans the scanner's not-trading suffix", () => {
    assert.deepEqual(cleanSymbol("NEWX(status=SETTLING)"), { symbol: "NEWX", note: "not trading" })
    assert.deepEqual(cleanSymbol("H100"), { symbol: "H100", note: null })
  })
  it("keeps every list, cleaned, by reason", () => {
    const l = skippedLists(meta)
    assert.equal(l.zero.length, 1)
    assert.equal(l.young[1].symbol, "NEWX")
    assert.equal(l.thin.length, 30)
    assert.deepEqual(skippedLists(undefined), { zero: [], young: [], thin: [] })
  })
  it("draws at most cap per stream and counts the rest honestly", () => {
    const e = placeEmbers(meta, 14)
    assert.equal(e.filter((x) => x.reason === "thin").length, 14)
    assert.equal(moreThan(30, 14), 16)
    assert.equal(moreThan(3, 14), 0)
  })
  it("one ember per coin, in its own stream", () => {
    for (const e of placeEmbers(meta)) assert.ok(Math.abs(e.x - STREAM_X[e.reason]) <= 0.75)
  })
  it("falls and cools with the scroll only", () => {
    const [e] = placeEmbers(meta)
    assert.deepEqual(emberAt(e, 0), { x: e.x, y: e.y0, cool: 0 })
    const done = emberAt(e, 1)
    assert.ok(done.y < e.y0 && done.cool > 0)
    assert.deepEqual(emberAt(e, 0.5), emberAt(e, 0.5))
  })
  it("stays inside the layout box", () => {
    for (const e of placeEmbers(meta)) {
      const end = emberAt(e, 1)
      assert.ok(Math.abs(end.x) <= INSTRUMENT_EXTENT && end.y >= -INSTRUMENT_EXTENT)
    }
  })
})
