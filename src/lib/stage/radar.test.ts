import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { R_OUT, bearingFor, dockFor, layoutToWorld, mixLayout, placeCoins, radarLayout, radarToWorld, radiusFor, topCoins, tucked } from "./radar.ts"

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

describe("radar layout", () => {
  const gutter = (w: number) => Math.max(16, 0.07 * w)
  it("desktop: ring clear of the copy column, reading inside the viewport", () => {
    for (const [w, h] of [[1440, 900], [1920, 1080], [1600, 900]]) {
      const l = radarLayout(w, h)
      assert.equal(l.mode, "wide")
      assert.ok(l.cx - l.r * 1.07 > gutter(w) + 500, `${w}: ring clears the copy`)
      assert.ok(l.cx + l.r * (1 + 0.4 / R_OUT) + 260 <= w, `${w}: reading fits`)
    }
  })
  it("laptop/tablet: reading moves below the ring, still clear of the copy", () => {
    for (const [w, h] of [[1024, 768], [1280, 720], [1366, 768]]) {
      const l = radarLayout(w, h)
      assert.equal(l.dock, "below")
      assert.ok(l.cx - l.r * 1.07 > gutter(w) + Math.min(500, w - 2 * gutter(w)), `${w}: ring clears the copy`)
      assert.ok(l.cx + l.r * 1.07 < w, `${w}: ring on screen`)
    }
  })
  it("portrait tablets stack like phones", () => {
    assert.equal(radarLayout(800, 1100).mode, "narrow")
  })
  it("phone: featured radar with room for the caption above and the reading above the HUD", () => {
    const l = radarLayout(390, 844)
    assert.equal(l.mode, "narrow")
    assert.ok(l.cy - l.r * 1.1 - 64 > 64, "caption clears the nav")
    assert.ok(l.cy + l.r * (1 + 0.45 / R_OUT) + 95 < 844 - 28, "reading clears the HUD")
    assert.ok(l.cx + l.r * 1.07 <= 390 && l.cx - l.r * 1.07 >= 0, "ring on screen")
  })
  it("phone: tucked rings sit below the copy and grow into the featured place", () => {
    const l = radarLayout(390, 844)
    const t = tucked(l, 844)
    assert.ok(t.cy - t.r > 0.56 * 844 && t.cy + t.r < 844 - 28)
    assert.deepEqual(mixLayout(t, l, 1), l)
    assert.deepEqual(mixLayout(t, l, 0), { ...l, cx: t.cx, cy: t.cy, r: t.r })
  })
  it("maps px to world on the camera's z = 0 plane", () => {
    const w = layoutToWorld({ mode: "wide", dock: "right", cx: 720, cy: 450, r: 0, labels: 5 }, 1440, 900)
    assert.ok(Math.abs(w.x) < 1e-9 && Math.abs(w.y) < 1e-9)
  })
})

describe("radar frame", () => {
  it("maps radar points through the frame, and hides while the radar is off", () => {
    const matrix = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 1, 2, 3, 1]
    assert.deepEqual(radarToWorld(1, 1, { matrix, visible: true }), [3, 4, 3])
    assert.equal(radarToWorld(1, 1, { matrix, visible: false }), null)
  })
})
