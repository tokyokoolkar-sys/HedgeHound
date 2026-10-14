import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { R_LONG, R_SHORT, SPLIT, legOffset, legs, reach, swingY, turnFor } from "./astrolabe.ts"
import { INSTRUMENT_EXTENT } from "./layout.ts"

describe("astrolabe", () => {
  it("starts concentric and splits into two legs, long left and short right", () => {
    assert.deepEqual(legs(0, 0), { long: [-0, 0], short: [0, 0] })
    const l = legs(1, 0)
    assert.equal(l.long[0], -SPLIT)
    assert.equal(l.short[0], SPLIT)
    assert.ok(R_LONG < R_SHORT, "long ring inside the short ring while concentric")
  })

  it("price moves both legs together: the gap never changes", () => {
    for (let t = 0; t <= 1; t += 0.05) {
      const l = legs(1, t)
      assert.equal(l.long[1], l.short[1])
      assert.equal(l.short[0] - l.long[0], 2 * SPLIT)
    }
  })

  it("the swing goes up and down once and comes back to rest", () => {
    assert.equal(swingY(0), 0)
    assert.ok(Math.abs(swingY(1)) < 1e-9)
    assert.ok(swingY(0.25) > 0 && swingY(0.75) < 0)
  })

  it("split eases and clamps", () => {
    assert.equal(legOffset(-1), 0)
    assert.equal(legOffset(2), SPLIT)
    assert.ok(legOffset(0.25) < SPLIT * 0.25)
  })

  it("rotation follows the scroll only", () => {
    assert.equal(turnFor(0), 0)
    assert.ok(turnFor(1) > turnFor(0.5))
  })

  it("fits the instrument layout box", () => {
    assert.ok(reach() <= INSTRUMENT_EXTENT + 0.05)
  })
})

describe("astrolabe legs never touch once split", () => {
  it("leaves a clear gap for the spread label", () => {
    assert.ok(2 * SPLIT - R_LONG - R_SHORT >= 1.5)
  })
})
