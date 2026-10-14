import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { placeAtlas, recap } from "./atlas.ts"

const row = (symbol: string, net_apr: number, persistence = 0.5, status = "ok") => ({ symbol, net_apr, persistence, status })

describe("atlas", () => {
  it("puts every coin at a stable spot inside the view", () => {
    const rows = [row("BTC", 5), row("1000PEPE", 46), row("ARB", 30)]
    const a = placeAtlas(rows)
    assert.equal(a.length, 3)
    assert.deepEqual(placeAtlas([...rows].reverse()).find((s) => s.symbol === "ARB"), a.find((s) => s.symbol === "ARB"))
    for (const s of a) assert.ok(Math.abs(s.x) < 1 && Math.abs(s.y) < 1)
  })
  it("twinkle grows with shakiness, size with net", () => {
    const [steady, shaky] = placeAtlas([row("A", 40, 1), row("B", 5, 0.2)])
    assert.equal(steady.shake, 0)
    assert.ok(shaky.shake > 0.7)
    assert.ok(steady.size > shaky.size)
  })
})

describe("atlas recap", () => {
  const rows = [row("1000PEPE", 46, 0.4), row("ARB", 35, 1), row("WIF", 23, 0.96), row("BTC", 5, 0.9)]
  it("merges letters when chapters featured the same coin", () => {
    const r = recap(rows, { loudest: "1000PEPE", steadiest: "ARB", shortlistFirst: "1000PEPE", kennel: ["PEPE", "WIF"] })
    assert.deepEqual(r, [
      { symbol: "1000PEPE", letters: ["β", "γ", "δ", "ε", "ζ"], role: "the loudest" },
      { symbol: "ARB", letters: ["δ"], role: "the one that stayed" },
    ])
  })
  it("skips picks that aren't on the board", () => {
    assert.deepEqual(recap(rows, { loudest: null, steadiest: "NOPE", shortlistFirst: null, kennel: [] }), [])
  })
})
