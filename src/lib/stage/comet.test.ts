import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { ARC_RISE, ARC_W, arcNormal, arcPoint, directionRole, flipped, headAt, segments, stripLabel } from "./comet.ts"
import { INSTRUMENT_EXTENT } from "./layout.ts"

const r = (window_h: number, hours_since_flip: number, persistence = 0.5, short = "Lighter") => ({ window_h, hours_since_flip, persistence, short })

describe("comet trail, honest from live fields", () => {
  it("held since the flip, faint before it, nothing outside the window", () => {
    assert.deepEqual(segments(r(23.8, 4.5)), [
      { from: 0, to: 4.5, kind: "held" },
      { from: 4.5, to: 23.8, kind: "before" },
    ])
  })
  it("no flip in the window: the whole window is held (the scanner reports the window length)", () => {
    assert.equal(flipped(r(12, 12)), false)
    assert.deepEqual(segments(r(12, 12.0)), [{ from: 0, to: 12, kind: "held" }])
  })
  it("no samples: no trail", () => {
    assert.deepEqual(segments(r(0, 0)), [])
  })
  it("caps at a day", () => {
    assert.equal(segments(r(30, 40))[0].to, 24)
  })
  it("colours by direction: short Lighter is scent, short Binance is scan", () => {
    assert.equal(directionRole("Lighter"), "scent")
    assert.equal(directionRole("Binance"), "scan")
  })
})

describe("comet geometry", () => {
  it("runs from 24 h ago on the left to now on the right, rising in the middle", () => {
    assert.deepEqual(arcPoint(24), [-ARC_W, -0.5])
    assert.deepEqual(arcPoint(0), [ARC_W, -0.5])
    assert.ok(arcPoint(12)[1] > arcPoint(0)[1])
  })
  it("normals point up and are unit length", () => {
    for (const h of [0, 6, 12, 18, 24]) {
      const [nx, ny] = arcNormal(h)
      assert.ok(ny > 0)
      assert.ok(Math.abs(Math.hypot(nx, ny) - 1) < 1e-9)
    }
  })
  it("fits the instrument layout box", () => {
    assert.ok(ARC_W + 0.4 <= INSTRUMENT_EXTENT && ARC_RISE < INSTRUMENT_EXTENT)
  })
  it("the head replays the window from its start to now", () => {
    assert.equal(headAt(0, r(20, 5)), 20)
    assert.equal(headAt(1, r(20, 5)), 0)
  })
  it("labels the strip in mono shorthand", () => {
    assert.equal(stripLabel(r(23.8, 4.4, 0.97)), "persist 0.97 · flip 4.4h · window 23.8h")
    assert.equal(stripLabel(r(9.5, 9.5, 1)), "persist 1.00 · no flip · window 9.5h")
  })
})
