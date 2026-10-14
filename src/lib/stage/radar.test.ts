import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { frameToWorld } from "./layout.ts"
import { R_OUT, bearingFor, dockFor, placeCoins, radiusFor, topCoins } from "./radar.ts"

const row = (symbol: string, net_apr: number, short = "Lighter", status = "ok") => ({ symbol, net_apr, status, short })

describe("radar axes", () => {
  it("puts short-Lighter coins on the right half and short-Binance on the left, clear of the axis", () => {
    for (const s of ["A", "BTC", "1000PEPE", "ZRO", "WIF"]) {
      assert.ok(Math.cos(bearingFor(s, "Lighter")) > 0.1)
      assert.ok(Math.cos(bearingFor(s, "Binance")) < -0.1)
    }
  })

  it("keeps a coin's bearing stable", () => {
    assert.equal(bearingFor("PEPE", "Lighter"), bearingFor("PEPE", "Lighter"))
    assert.notEqual(bearingFor("PEPE", "Lighter"), bearingFor("WIF", "Lighter"))
  })

  it("reads radius as signed net: louder nearer the centre, losses outside the break-even ring", () => {
    assert.ok(radiusFor(50) < radiusFor(5))
    assert.ok(radiusFor(5) < R_OUT)
    assert.ok(radiusFor(-5) > R_OUT)
    assert.ok(radiusFor(-50) > radiusFor(-5))
    assert.ok(radiusFor(500) > 0)
  })
})

describe("radar placement", () => {
  it("places at most 40 coins, always keeping the featured one", () => {
    const rows = Array.from({ length: 50 }, (_, i) => row(`S${i}`, i))
    assert.equal(placeCoins(rows).length, 40)
    const kept = placeCoins(rows, "S45")
    assert.equal(kept.length, 40)
    assert.ok(kept.some((k) => k.symbol === "S45"))
    const k = placeCoins(rows)[7]
    assert.ok(Math.abs(Math.hypot(k.x, k.y) - radiusFor(7)) < 1e-9)
  })

  it("labels the loudest positive spreads only, never the featured coin, never two that touch", () => {
    const placed = placeCoins([row("A", 5), row("B", -80), row("C", 40), row("D", 1), row("E", 20), row("F", 12, "Binance"), row("G", 3)])
    const top = topCoins(placed, "C")
    assert.ok(!top.some((k) => k.symbol === "C" || k.net <= 0))
    assert.deepEqual(
      top.map((k) => k.net),
      [...top].map((k) => k.net).sort((a, b) => b - a),
    )
    for (const a of top) for (const b of top) if (a !== b) assert.ok(Math.abs(a.x - b.x) >= 1.5 || Math.abs(a.y - b.y) >= 0.42)
  })

  it("docks the reading outside the ring", () => {
    const [k] = placeCoins([row("A", 10)])
    assert.ok(dockFor(k, "right")[0] > R_OUT)
    assert.ok(dockFor(k, "below")[1] < -R_OUT)
  })
})

describe("instrument frame", () => {
  it("maps radar points through the frame, and hides while the radar is off", () => {
    const matrix = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 1, 2, 3, 1]
    assert.deepEqual(frameToWorld({ matrix, visible: true }, 1, 1), [3, 4, 3])
    assert.equal(frameToWorld({ matrix, visible: false }, 1, 1), null)
  })
})
