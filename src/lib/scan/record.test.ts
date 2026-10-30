import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { toScanRecord, pollAndRecord } from "./record.ts"
import { normalizeScan } from "./normalize.ts"
import type { ScanParams } from "./types.ts"
import { DEFAULT_SCAN_PARAMS } from "./types.ts"

const __dirname = dirname(fileURLToPath(import.meta.url))

test("toScanRecord returns null for SAMPLE (live false)", () => {
  const scan = normalizeScan({ rows: [], err: null, ts: 0 })!
  const r = toScanRecord(scan, { ...DEFAULT_SCAN_PARAMS, min: 0 })
  assert.equal(r, null)
})

test("toScanRecord returns null when ts null", () => {
  const scan = normalizeScan({ rows: [], err: "x", ts: 100 })!
  const r = toScanRecord(scan, { ...DEFAULT_SCAN_PARAMS, min: 0 })
  assert.equal(r, null)
})

test("toScanRecord maps fields for live scan", () => {
  const body = JSON.parse(readFileSync(join(__dirname, "__fixtures__/scan.json"), "utf8"))
  const scan = normalizeScan(body)
  assert.ok(scan && scan.live)
  const params: ScanParams = { min: 0, hold: 72, cost: 0.3, lev: 2 }
  const r = toScanRecord(scan!, params)
  assert.ok(r)
  assert.equal(r!.coins.length, scan!.rows.length)
  assert.equal(r!.minApr, 0)
})

test("pollAndRecord: scanner failing -> no throw, no save", async () => {
  let saved = false
  await pollAndRecord({
    fetchJson: async () => { throw new Error("boom") },
    save: async () => { saved = true },
  })
  assert.equal(saved, false)
})