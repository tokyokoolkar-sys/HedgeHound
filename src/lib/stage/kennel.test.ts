import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { PEN_R, baseSymbol, inKennel, kennelLabels, kennelStats, labelSide, median, placeKennel, verdict } from "./kennel.ts"
import { INSTRUMENT_EXTENT } from "./layout.ts"

const LIST = ["PEPE", "WIF", "BONK", "SHIB", "MOG", "BABYDOGE"] as const
const row = (symbol: string, net_apr: number, persistence: number, status = "ok") => ({ symbol, net_apr, persistence, status })

describe("kennel membership", () => {
  it("matches with or without the exchanges' size prefix", () => {
    assert.equal(baseSymbol("1000PEPE"), "PEPE")
    assert.equal(baseSymbol("1000000MOG"), "MOG")
    assert.equal(baseSymbol("1MBABYDOGE"), "BABYDOGE")
    assert.equal(baseSymbol("WIF"), "WIF")
    assert.ok(inKennel("1000SHIB", LIST))
    assert.ok(!inKennel("BTC", LIST))
  })
  it("does not strip digits that are part of a name", () => {
    assert.equal(baseSymbol("1INCH"), "1INCH")
  })
})

describe("kennel stats", () => {
  it("median handles odd, even and empty lists", () => {
    assert.equal(median([3, 1, 2]), 2)
    assert.equal(median([4, 1, 3, 2]), 2.5)
    assert.equal(median([]), null)
  })
  it("compares the kennel with everyone else, from the rows only", () => {
    const rows = [row("1000PEPE", 40, 0.4), row("WIF", 20, 0.6), row("BTC", 5, 1), row("ETH", 8, 0.9), row("ARB", 30, 0.8)]
    const s = kennelStats(rows, LIST)
    assert.deepEqual(s.kennel, { n: 2, held: 0.5, net: 30 })
    assert.deepEqual(s.rest, { n: 3, held: 0.9, net: 8 })
  })
})

describe("kennel placement", () => {
  const rows = [row("1000PEPE", 46, 0.42), row("WIF", 23, 0.96), row("1000BONK", -4, 0.3), row("BTC", 5, 1)]
  it("places only kennel coins, inside the pen, with shake = 1 − persistence", () => {
    const st = placeKennel(rows, LIST)
    assert.deepEqual(st.map((s) => s.symbol).sort(), ["1000BONK", "1000PEPE", "WIF"])
    for (const s of st) assert.ok(Math.hypot(s.x, s.y) < PEN_R)
    assert.equal(st.find((s) => s.symbol === "WIF")!.shake.toFixed(2), "0.04")
  })
  it("holds still across refreshes", () => {
    assert.deepEqual(placeKennel(rows, LIST), placeKennel([...rows].reverse(), LIST))
  })
  it("labels never touch", () => {
    const names = ["PEPE", "WIF", "BONK", "SHIB", "MOG", "DOGE", "FLOKI", "BOME", "MEME", "POPCAT", "NEIRO", "TURBO"]
    const l = kennelLabels(placeKennel(names.map((n, i) => row(n, i * 3, 0.5)), names))
    assert.ok(l.length > 0)
    const span = (k: { x: number }) => (labelSide(k) === "right" ? [k.x, k.x + 2.1] : [k.x - 2.1, k.x])
    for (const a of l)
      for (const b of l) if (a !== b) assert.ok(Math.abs(a.y - b.y) >= 0.42 || span(a)[1] <= span(b)[0] || span(b)[1] <= span(a)[0])
  })
  it("fits the instrument layout box", () => {
    assert.ok(PEN_R + 0.4 <= INSTRUMENT_EXTENT)
  })
})

describe("kennel verdict", () => {
  const g = (n: number, held: number | null, net: number | null) => ({ n, held, net })
  it("says worse manners only when the data says so", () => {
    assert.equal(verdict(g(3, 0.5, 30), g(9, 0.9, 10)), "Worse manners today: the kennel held less than the rest, and paid more.")
    assert.equal(verdict(g(3, 0.9, 5), g(9, 0.9, 10)), "Not worse today: the kennel held as well as the rest, and did not pay more.")
  })
  it("refuses to judge without both groups", () => {
    assert.equal(verdict(g(0, null, null), g(9, 0.9, 10)), "Not enough coins to compare today.")
  })
})
