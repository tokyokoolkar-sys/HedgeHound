import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { DEFAULT_BOOK } from "../scent.ts"
import { ORB_R, POCKET_R, clearsBar, emptyReason, isDefaultBook, netForBook, pocketSpot } from "./den.ts"

const row = (symbol: string, gross_apr: number, status = "ok") => ({ symbol, gross_apr, status })

describe("den: your bar", () => {
  it("re-amortises the round trip at the book's hold, like the scanner", () => {
    // 0.3% over 72 h, annualised: 0.3 / 72 × 8760 = 36.5
    assert.ok(Math.abs(netForBook(50, { cost: 0.3, hold: 72 }) - 13.5) < 1e-9)
    assert.ok(netForBook(50, { cost: 0.3, hold: 336 }) > netForBook(50, { cost: 0.3, hold: 72 }))
  })
  it("only clean coins at or above the minimum, loudest first", () => {
    const rows = [row("A", 60), row("B", 90, "building history"), row("C", 80), row("D", 40)]
    const out = clearsBar(rows, DEFAULT_BOOK)
    assert.deepEqual(
      out.map((r) => r.symbol),
      ["C", "A"],
    )
    assert.ok(out.every((r) => r.net >= DEFAULT_BOOK.minNet))
  })
  it("an empty bar is empty, not padded", () => {
    assert.deepEqual(clearsBar([row("A", 10)], DEFAULT_BOOK), [])
  })
  it("says when the book is still the defaults", () => {
    assert.equal(isDefaultBook(DEFAULT_BOOK, DEFAULT_BOOK), true)
    assert.equal(isDefaultBook({ ...DEFAULT_BOOK, hold: 96 }, DEFAULT_BOOK), false)
  })
})

describe("den: pocket sky", () => {
  it("keeps each coin at a stable spot inside the orb", () => {
    const a = pocketSpot("1000PEPE")
    assert.deepEqual(a, pocketSpot("1000PEPE"))
    assert.ok(Math.hypot(...a) <= POCKET_R + 1e-9)
    assert.ok(POCKET_R < ORB_R)
  })
})

describe("why nothing clears", () => {
  it("says no coin is clean yet before saying the bar is too high", () => {
    assert.equal(emptyReason([{ symbol: "A", gross_apr: 40, status: "building history" }], 0), "none-clean")
    assert.equal(emptyReason([{ symbol: "A", gross_apr: 40, status: "ok" }], 0), "bar")
    assert.equal(emptyReason([{ symbol: "A", gross_apr: 40, status: "ok" }], 1), null)
  })
})
