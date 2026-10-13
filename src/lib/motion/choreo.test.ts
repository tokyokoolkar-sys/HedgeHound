import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { CHAPTERS, chapterOf, enterId } from "../../content/edition.ts"
import { formatCoordinate } from "../stage/coordinates.ts"
import { copyFrame, crawlFront, resolveIn, wordLook } from "./choreo.ts"

const vh = 900

describe("copy choreography", () => {
  it("resolveIn: hidden and soft at 0, sharp and in place at 1", () => {
    assert.deepEqual(resolveIn(0), { opacity: 0, y: 14, blur: 12 })
    assert.deepEqual(resolveIn(1), { opacity: 1, y: 0, blur: 0 })
  })

  it("rise: the block starts a screen below and settles by 16%", () => {
    assert.equal(copyFrame(0.0001, "rise", { vh, reduced: false }).block.y > vh * 0.9, true)
    assert.equal(copyFrame(0.16, "rise", { vh, reduced: false }).block.y, 0)
  })

  it("chapters blur out upward over the last 14%, except the last one", () => {
    const end = copyFrame(1, "fade", { vh, reduced: false })
    assert.equal(end.block.opacity, 0)
    assert.equal(end.block.y, -40)
    assert.equal(copyFrame(1, "fade", { vh, reduced: false, last: true }).block.opacity, 1)
  })

  it("fade/crawl: title, subtitle and items resolve in sequence", () => {
    const f = copyFrame(0.1, "crawl", { vh, reduced: false })
    assert.ok(f.title.opacity > f.subtitle.opacity)
    assert.ok(f.subtitle.opacity > f.item(0).opacity)
    assert.ok(f.item(0).opacity >= f.item(1).opacity)
  })

  it("is a pure function of progress (same input, same output)", () => {
    assert.deepEqual(copyFrame(0.42, "fade", { vh, reduced: false }).block, copyFrame(0.42, "fade", { vh, reduced: false }).block)
  })

  it("reduced motion: no blur, no travel, visible inside the section", () => {
    const f = copyFrame(0.5, "rise", { vh, reduced: true })
    assert.deepEqual(f.block, { opacity: 1, y: 0, blur: 0 })
    assert.equal(copyFrame(0, "rise", { vh, reduced: true }).block.opacity, 0)
  })

  it("rise band: α copy waits for the constellation, then rises in its band", () => {
    const band = [0.34, 0.5] as [number, number]
    assert.equal(copyFrame(0.2, "rise", { vh, reduced: false, riseBand: band }).block.opacity, 0)
    assert.ok(copyFrame(0.36, "rise", { vh, reduced: false, riseBand: band }).block.y > 0)
    assert.equal(copyFrame(0.5, "rise", { vh, reduced: false, riseBand: band }).block.y, 0)
  })

  it("wordLook: words resolve in order and all land by q = 1", () => {
    assert.ok(wordLook(0.3, 0, 10).opacity > wordLook(0.3, 5, 10).opacity)
    for (let i = 0; i < 10; i++) assert.equal(wordLook(1, i, 10).opacity, 1)
    assert.equal(wordLook(0, 0, 10).opacity, 0)
  })

  it("crawlFront: idle outside the crawl, eats first, rebuilds second", () => {
    assert.equal(crawlFront(0).front, null)
    assert.equal(crawlFront(1).front, null)
    assert.equal(crawlFront(0.25).mode, "out")
    assert.equal(crawlFront(0.75).mode, "in")
  })
})

describe("edition content", () => {
  it("has the overture and α–κ in order, each letter once", () => {
    assert.equal(CHAPTERS[0].id, "overture")
    assert.equal(CHAPTERS[0].letter, null)
    assert.deepEqual(
      CHAPTERS.slice(1).map((c) => c.letter),
      ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ"],
    )
  })

  it("every crawl chapter has a crawl length; ids are unique", () => {
    for (const c of CHAPTERS) if (c.enter === "crawl") assert.ok(c.enterLength, c.id)
    assert.equal(new Set(CHAPTERS.map((c) => c.id)).size, CHAPTERS.length)
  })

  it("no copy contains digits (figures need a SourceTag and live in chapters, not content)", () => {
    for (const c of CHAPTERS) {
      // "Phase 0" is a name, not a figure.
      const text = [c.title, c.subtitle, c.kicker, ...(c.body ?? [])].filter(Boolean).join(" ").replace(/Phase 0/g, "")
      assert.ok(!/\d/.test(text), `${c.id}: "${text}"`)
    }
  })

  it("chapterOf maps crawl sections back to their chapter", () => {
    assert.equal(chapterOf(enterId("sniff")), "sniff")
    assert.equal(chapterOf("canis"), "canis")
    assert.equal(chapterOf(null), null)
  })
})

describe("HUD coordinate", () => {
  it("rests on Sirius with a true minus and primes", () => {
    assert.equal(formatCoordinate(0, 0), "RA 06h 45m 09s · DEC −16° 43′")
  })
  it("drifts with the pointer", () => {
    assert.notEqual(formatCoordinate(1, 1), formatCoordinate(0, 0))
  })
})
