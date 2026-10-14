import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { sourceLine } from "./source.ts"

describe("ledger source line", () => {
  it("says live, stale, offline or asking, never more than it knows", () => {
    assert.equal(sourceLine({ live: true, stale: false }), "scanner live")
    assert.equal(sourceLine({ live: true, stale: true }), "scanner live · last poll older than five minutes")
    assert.equal(sourceLine({ live: false, stale: false }), "scanner offline · showing a sample")
    assert.equal(sourceLine({ live: false, stale: false, loading: true }), "asking the scanner")
  })
})
