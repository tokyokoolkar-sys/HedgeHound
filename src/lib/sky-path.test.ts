import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { parseStar, skyPath, skyTitle, starFromPath } from "./sky-path.ts"

describe("sky path", () => {
  it("upper-cases a symbol and refuses anything else", () => {
    assert.equal(parseStar("1000pepe"), "1000PEPE")
    assert.equal(parseStar("btc-usd"), "BTC-USD")
    assert.equal(parseStar(""), undefined)
    assert.equal(parseStar("a/b"), undefined)
    assert.equal(parseStar("x".repeat(25)), undefined)
    assert.equal(parseStar(undefined), undefined)
  })
  it("builds /sky and /sky/<STAR>", () => {
    assert.equal(skyPath(), "/sky")
    assert.equal(skyPath("BTC"), "/sky/BTC")
  })
  it("reads the star back out of a pathname", () => {
    assert.equal(starFromPath("/sky/eth"), "ETH")
    assert.equal(starFromPath("/sky/ETH/"), "ETH")
    assert.equal(starFromPath("/sky"), undefined)
    assert.equal(starFromPath("/sky/a/b"), undefined)
    assert.equal(starFromPath("/scanner"), undefined)
  })
  it("titles the page after the star", () => {
    assert.equal(skyTitle("BTC"), "BTC · The Sky · HedgeHound")
    assert.equal(skyTitle(), "The Sky · HedgeHound")
  })
})
