import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { CHAPTERS, enterId } from "../../content/edition.ts"
import { DEFAULT_RHYTHM, arrival, chaptersFor, departure, parseRhythm } from "./rhythm.ts"

const crawlIds = (r: Parameters<typeof chaptersFor>[1]) =>
  chaptersFor(CHAPTERS, r)
    .filter((d) => d.enter === "crawl")
    .map((d) => d.id)

describe("rhythm switches", () => {
  it("parses the query string, falling back to the recommendation", () => {
    assert.deepEqual(parseRhythm("?seams=every&handover=fade&pace=uniform"), { seams: "every", handover: "fade", pace: "uniform" })
    assert.deepEqual(parseRhythm("?seams=nope"), DEFAULT_RHYTHM)
    assert.deepEqual(parseRhythm(""), DEFAULT_RHYTHM)
  })
  it("seams: P3 crawls only into β; acts into β, ε, θ; every into β…ι", () => {
    assert.deepEqual(crawlIds({ ...DEFAULT_RHYTHM, seams: "rise" }), ["sniff"])
    assert.deepEqual(crawlIds({ ...DEFAULT_RHYTHM, seams: "acts" }), ["sniff", "hedge", "sky"])
    assert.deepEqual(crawlIds({ ...DEFAULT_RHYTHM, seams: "every" }), ["sniff", "spread", "trail", "hedge", "kennel", "embers", "sky", "den"])
  })
  it("β keeps its own longer crawl; new crawls get one; κ never crawls", () => {
    const defs = chaptersFor(CHAPTERS, { ...DEFAULT_RHYTHM, seams: "every" })
    assert.equal(defs.find((d) => d.id === "sniff")?.enterLength, "190svh")
    assert.equal(defs.find((d) => d.id === "spread")?.enterLength, "150svh")
    assert.equal(defs.find((d) => d.id === "ledger")?.enter, "fade")
  })
  it("pace: varied shortens δ and η only", () => {
    const u = chaptersFor(CHAPTERS, { ...DEFAULT_RHYTHM, pace: "uniform" })
    const v = chaptersFor(CHAPTERS, { ...DEFAULT_RHYTHM, pace: "varied" })
    const changed = v.filter((d, i) => d.length !== u[i].length).map((d) => d.id)
    assert.deepEqual(changed, ["trail", "embers"])
  })
})

describe("handovers", () => {
  const defs = chaptersFor(CHAPTERS, DEFAULT_RHYTHM)
  it("an instrument entered by a crawl is there from the crawl's midpoint", () => {
    assert.equal(arrival({ [enterId("hedge")]: 0.4 }, defs, "hedge", DEFAULT_RHYTHM).started, false)
    assert.equal(arrival({ [enterId("hedge")]: 0.6 }, defs, "hedge", DEFAULT_RHYTHM).started, true)
  })
  it("an instrument before a crawl holds until the crawl eats it", () => {
    const d = departure({ trail: 1, [enterId("hedge")]: 0.3 }, defs, "trail", DEFAULT_RHYTHM)
    assert.deepEqual(d, { until: true, away: 0 })
    assert.equal(departure({ trail: 1, [enterId("hedge")]: 0.6 }, defs, "trail", DEFAULT_RHYTHM).until, false)
  })
  it("inside an act, travel/fade hand over in place at the very end; recede into depth earlier", () => {
    assert.equal(departure({ spread: 0.9 }, defs, "spread", DEFAULT_RHYTHM).away, 0)
    assert.ok(departure({ spread: 0.9 }, defs, "spread", { ...DEFAULT_RHYTHM, handover: "recede" }).away > 0)
  })
})
