import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { carouselRows, formatNet, pickLoudest } from "./loudest.ts"
import type { ScanRow } from "./types.ts"

const row = (symbol: string, net: number, status: ScanRow["status"]) => ({ symbol, net_apr: net, status }) as ScanRow

describe("loudest reading", () => {
  it("prefers the strongest clean scent over a louder coin still building", () => {
    const rows = [row("A", 80, "building history"), row("B", 30, "ok"), row("C", 40, "ok")]
    assert.deepEqual(pickLoudest(rows), { symbol: "C", net: 40, ok: true })
  })
  it("falls back to the loudest building coin when nothing is clean", () => {
    const rows = [row("A", 10, "building history"), row("B", 50, "building history")]
    assert.deepEqual(pickLoudest(rows), { symbol: "B", net: 50, ok: false })
  })
  it("is null with no rows", () => {
    assert.equal(pickLoudest([]), null)
  })
})

describe("carousel rows", () => {
  const rows = Array.from({ length: 13 }, (_, i) => row(`S${i}`, i, i % 2 ? "ok" : "building history"))
  it("excludes the featured coin and keeps whole groups of five", () => {
    const out = carouselRows(rows, "S3")
    assert.equal(out.length, 10)
    assert.ok(!out.some((r) => r.symbol === "S3"))
  })
  it("marks alerting coins: clean and paying only", () => {
    assert.equal(carouselRows(rows, null).find((r) => r.symbol === "S1")?.alert, true)
    const losing = carouselRows([row("L", -1.5, "ok"), ...rows], null).find((r) => r.symbol === "L")
    assert.equal(losing?.alert, false)
  })
})

describe("formatNet", () => {
  it("uses a true minus and one decimal", () => {
    assert.equal(formatNet(-20.73), "−20.7%")
    assert.equal(formatNet(46.66), "46.7%")
  })
})
