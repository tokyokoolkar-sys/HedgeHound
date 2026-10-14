import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { FIELD_H, FIELD_W, fieldLabelSide, heldY, labelled, netX, placeField, shortlist, tickText } from "./field.ts"
import { INSTRUMENT_EXTENT } from "./layout.ts"

const row = (symbol: string, net_apr: number, persistence = 0.5, status = "ok") => ({ symbol, net_apr, persistence, status })

describe("field chart axes", () => {
  it("net APR runs left to right, linear, clamped at both ends", () => {
    assert.equal(netX(-100), -FIELD_W)
    assert.equal(netX(500), FIELD_W)
    assert.ok(netX(10) > netX(0))
    assert.ok(Math.abs(netX(20) - netX(10) - (netX(10) - netX(0))) < 1e-9)
  })
  it("break-even sits inside the chart", () => {
    assert.ok(netX(0) > -FIELD_W && netX(0) < FIELD_W)
  })
  it("persistence runs bottom to top", () => {
    assert.equal(heldY(0), -FIELD_H)
    assert.equal(heldY(1), FIELD_H)
  })
  it("fits the instrument layout box", () => {
    assert.ok(FIELD_W + 0.5 <= INSTRUMENT_EXTENT)
  })
  it("ticks use a true minus", () => {
    assert.equal(tickText(-20), "−20")
    assert.equal(tickText(40), "40")
  })
})

describe("field placement", () => {
  it("puts each coin at its net and persistence, gathering from a stable scattered start", () => {
    const [a] = placeField([row("ARB", 35, 0.9)])
    assert.equal(a.x, netX(35))
    assert.equal(a.y, heldY(0.9))
    const [b] = placeField([row("ARB", 35, 0.9)])
    assert.deepEqual([a.sx, a.sy], [b.sx, b.sy])
  })
  it("labels only coins that clear their costs, never two touching", () => {
    const stars = placeField([row("A", 30, 1), row("B", 29.5, 1), row("C", -10, 1), row("D", 10, 0.2), row("E", 50, 0.6)])
    const l = labelled(stars)
    assert.ok(!l.some((k) => k.net <= 0))
    const span = (k: { x: number }) => (fieldLabelSide(k) === "right" ? [k.x, k.x + 1.9] : [k.x - 1.9, k.x])
    for (const a of l)
      for (const b of l) if (a !== b) assert.ok(Math.abs(a.y - b.y) >= 0.36 || span(a)[1] <= span(b)[0] || span(b)[1] <= span(a)[0])
    assert.ok(!(l.some((k) => k.symbol === "A") && l.some((k) => k.symbol === "B")))
  })
})

describe("shortlist", () => {
  it("clean first, then building, loudest first, only spreads that clear costs", () => {
    const rows = [row("A", 10), row("B", 40, 0.5, "building history"), row("C", 30), row("D", -5), row("E", 20, 0.5, "building history")]
    assert.deepEqual(
      shortlist(rows).map((r) => r.symbol),
      ["C", "A", "B", "E"],
    )
  })
  it("caps at n", () => {
    assert.equal(shortlist(Array.from({ length: 20 }, (_, i) => row(`S${i}`, i + 1)), 8).length, 8)
  })
})
