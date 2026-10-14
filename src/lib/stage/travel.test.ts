import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { TRAVEL_SEAMS, boxToWorld, flight, flightAlpha, seamT } from "./travel.ts"

describe("travelling coins", () => {
  const seam = TRAVEL_SEAMS[0]
  it("a seam lifts off at the end of one chapter and lands early in the next", () => {
    assert.equal(seamT({ sniff: 0.5 }, seam), 0)
    assert.equal(seamT({ sniff: 1, spread: 0 }, seam), 0.5)
    assert.equal(seamT({ sniff: 1, spread: 0.2 }, seam), 1)
  })
  it("flies from the first spot to the second, rising through the middle", () => {
    assert.deepEqual(flight([0, 0], [2, 0], 0), [0, 0])
    const end = flight([0, 0], [2, 0], 1)
    assert.ok(Math.abs(end[0] - 2) < 1e-9 && Math.abs(end[1]) < 1e-9)
    assert.ok(flight([0, 0], [2, 0], 0.5)[1] > 0)
  })
  it("is only visible in flight", () => {
    assert.equal(flightAlpha(0), 0)
    assert.equal(flightAlpha(1), 0)
    assert.equal(flightAlpha(0.5), 1)
  })
  it("places box-local points like the instruments do", () => {
    assert.deepEqual(boxToWorld({ x: 1, y: 2, scale: 0.5 }, [2, -2]), [2, 1])
  })
})
