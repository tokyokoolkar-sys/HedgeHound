import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { activeIndex, band, clamp01, damp, sectionProgress, smooth } from "./math.ts"
import { pickTier } from "./quality.ts"

describe("scroll maths", () => {
  it("sectionProgress is 0 before, 1 after, linear inside", () => {
    assert.equal(sectionProgress(0, 1000, 500), 0)
    assert.equal(sectionProgress(1000, 1000, 500), 0)
    assert.equal(sectionProgress(1250, 1000, 500), 0.5)
    assert.equal(sectionProgress(1500, 1000, 500), 1)
    assert.equal(sectionProgress(9000, 1000, 500), 1)
  })

  it("sectionProgress never divides by zero", () => {
    assert.equal(sectionProgress(10, 0, 0), 1)
  })

  it("band remaps and clamps, and handles a zero-width band", () => {
    assert.equal(band(0.5, 0.25, 0.75), 0.5)
    assert.equal(band(0, 0.25, 0.75), 0)
    assert.equal(band(1, 0.25, 0.75), 1)
    assert.equal(band(0.5, 0.5, 0.5), 1)
    assert.equal(band(0.4, 0.5, 0.5), 0)
  })

  it("smooth eases with fixed ends", () => {
    assert.equal(smooth(0), 0)
    assert.equal(smooth(1), 1)
    assert.equal(smooth(0.5), 0.5)
  })

  it("clamp01", () => {
    assert.equal(clamp01(-2), 0)
    assert.equal(clamp01(2), 1)
  })

  it("activeIndex is the last section entered, or the first", () => {
    assert.equal(activeIndex([0, 0, 0]), 0)
    assert.equal(activeIndex([1, 0.3, 0]), 1)
    assert.equal(activeIndex([1, 1, 1]), 2)
    assert.equal(activeIndex([]), 0)
  })

  it("damp approaches the target, never overshoots, and is frame-rate independent", () => {
    const one = damp(0, 1, 3, 1 / 30)
    const two = damp(damp(0, 1, 3, 1 / 60), 1, 3, 1 / 60)
    assert.ok(one > 0 && one < 1)
    assert.ok(Math.abs(one - two) < 1e-12)
    assert.equal(damp(1, 1, 3, 0.5), 1)
  })
})

describe("quality tier", () => {
  it("desktop with plenty of cores is high", () => {
    assert.equal(pickTier({ cores: 12, memory: 16, width: 1440 }), "high")
  })
  it("unknown hints on a desktop width stay high", () => {
    assert.equal(pickTier({ width: 1440 }), "high")
  })
  it("phones, touch-first or modest hardware are mid", () => {
    assert.equal(pickTier({ cores: 8, width: 390 }), "mid")
    assert.equal(pickTier({ cores: 8, width: 1024, coarse: true }), "mid")
    assert.equal(pickTier({ cores: 4, memory: 8, width: 1440 }), "mid")
  })
  it("weak CPU and low memory together are low", () => {
    assert.equal(pickTier({ cores: 4, memory: 2, width: 390 }), "low")
  })
})
