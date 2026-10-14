import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { INSTRUMENT_EXTENT as R_OUT, instrumentLayout, layoutToWorld, mixLayout, tucked } from "./layout.ts"

describe("instrument layout", () => {
  const gutter = (w: number) => Math.max(16, 0.07 * w)
  it("desktop: ring clear of the copy column, reading inside the viewport", () => {
    for (const [w, h] of [[1440, 900], [1920, 1080], [1600, 900]]) {
      const l = instrumentLayout(w, h)
      assert.equal(l.mode, "wide")
      assert.ok(l.cx - l.r * 1.07 > gutter(w) + 500, `${w}: ring clears the copy`)
      assert.ok(l.cx + l.r * (1 + 0.4 / R_OUT) + 260 <= w, `${w}: reading fits`)
    }
  })
  it("laptop/tablet: reading moves below the ring, still clear of the copy", () => {
    for (const [w, h] of [[1024, 768], [1280, 720], [1366, 768]]) {
      const l = instrumentLayout(w, h)
      assert.equal(l.dock, "below")
      assert.ok(l.cx - l.r * 1.07 > gutter(w) + Math.min(500, w - 2 * gutter(w)), `${w}: ring clears the copy`)
      assert.ok(l.cx + l.r * 1.07 < w, `${w}: ring on screen`)
    }
  })
  it("portrait tablets stack like phones", () => {
    assert.equal(instrumentLayout(800, 1100).mode, "narrow")
  })
  it("phone: featured radar with room for the caption above and the reading above the HUD", () => {
    const l = instrumentLayout(390, 844)
    assert.equal(l.mode, "narrow")
    assert.ok(l.cy - l.r * 1.1 - 64 > 64, "caption clears the nav")
    assert.ok(l.cy + l.r * (1 + 0.45 / R_OUT) + 95 < 844 - 28, "reading clears the HUD")
    assert.ok(l.cx + l.r * 1.07 <= 390 && l.cx - l.r * 1.07 >= 0, "ring on screen")
  })
  it("phone: tucked rings sit below the copy and grow into the featured place", () => {
    const l = instrumentLayout(390, 844)
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

