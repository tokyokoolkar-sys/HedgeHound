import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { CHAPTERS, enterId } from "../../content/edition.ts"
import { EDITION, RHYTHM, arrival, chaptersFor, departure } from "./rhythm.ts"

const crawlIds = (r: Parameters<typeof chaptersFor>[1]) =>
  chaptersFor(CHAPTERS, r)
    .filter((d) => d.enter === "crawl")
    .map((d) => d.id)

describe("rhythm switches", () => {
  it("the Edition uses the owner's pick: acts · travel · varied", () => {
    assert.deepEqual(RHYTHM, { seams: "acts", handover: "travel", pace: "varied" })
    assert.deepEqual(EDITION, chaptersFor(CHAPTERS, RHYTHM))
  })
  it("seams: P3 crawls only into β; acts into β, ε, θ; every into β…ι", () => {
    assert.deepEqual(crawlIds({ ...RHYTHM, seams: "rise" }), ["sniff"])
    assert.deepEqual(crawlIds({ ...RHYTHM, seams: "acts" }), ["sniff", "hedge", "sky"])
    assert.deepEqual(crawlIds({ ...RHYTHM, seams: "every" }), ["sniff", "spread", "trail", "hedge", "kennel", "embers", "sky", "den"])
  })
  it("β keeps its own longer crawl; new crawls get one; κ never crawls", () => {
    const defs = chaptersFor(CHAPTERS, { ...RHYTHM, seams: "every" })
    assert.equal(defs.find((d) => d.id === "sniff")?.enterLength, "190svh")
    assert.equal(defs.find((d) => d.id === "spread")?.enterLength, "150svh")
    assert.equal(defs.find((d) => d.id === "ledger")?.enter, "fade")
  })
  it("pace: varied shortens δ and η only", () => {
    const u = chaptersFor(CHAPTERS, { ...RHYTHM, pace: "uniform" })
    const v = chaptersFor(CHAPTERS, { ...RHYTHM, pace: "varied" })
    const changed = v.filter((d, i) => d.length !== u[i].length).map((d) => d.id)
    assert.deepEqual(changed, ["trail", "embers"])
  })
})

describe("handovers", () => {
  const defs = chaptersFor(CHAPTERS, RHYTHM)
  it("an instrument entered by a crawl is there from the crawl's midpoint", () => {
    assert.equal(arrival({ [enterId("hedge")]: 0.4 }, defs, "hedge", RHYTHM).started, false)
    assert.equal(arrival({ [enterId("hedge")]: 0.6 }, defs, "hedge", RHYTHM).started, true)
  })
  it("an instrument before a crawl holds until the crawl eats it", () => {
    const d = departure({ trail: 1, [enterId("hedge")]: 0.3 }, defs, "trail", RHYTHM)
    assert.deepEqual(d, { until: true, away: 0 })
    assert.equal(departure({ trail: 1, [enterId("hedge")]: 0.6 }, defs, "trail", RHYTHM).until, false)
  })
  it("inside an act, travel/fade hand over in place at the very end; recede into depth earlier", () => {
    assert.equal(departure({ spread: 0.9 }, defs, "spread", RHYTHM).away, 0)
    assert.ok(departure({ spread: 0.9 }, defs, "spread", { ...RHYTHM, handover: "recede" }).away > 0)
  })
})
