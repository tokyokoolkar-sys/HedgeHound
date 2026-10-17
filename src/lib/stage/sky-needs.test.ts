import assert from "node:assert/strict"
import { test } from "node:test"
import type { ChapterId } from "../../content/edition.ts"
import { neededObjects } from "./sky-needs.ts"

const ORDER: ChapterId[] = ["overture", "canis", "sniff", "spread", "trail", "hedge", "kennel", "embers", "sky", "den", "ledger"]
const sorted = (s: Set<string>) => [...s].sort()

test("the Edition's top needs only the hound and Canis Major", () => {
  assert.deepEqual(sorted(neededObjects("edition", null, ORDER)), ["canis", "hound"])
  assert.deepEqual(sorted(neededObjects("edition", "overture", ORDER)), ["canis", "hound"])
})

test("one chapter ahead: Canis Major's chapter also readies β's radar", () => {
  assert.deepEqual(sorted(neededObjects("edition", "canis", ORDER)), ["canis", "hound", "radar", "travelers"])
})

test("mid-Edition: the neighbours of ε", () => {
  assert.deepEqual(sorted(neededObjects("edition", "hedge", ORDER)), ["astrolabe", "comet", "field", "kennel", "travelers"])
})

test("κ brings Canis Major back and keeps ι's orb", () => {
  assert.deepEqual(sorted(neededObjects("edition", "ledger", ORDER)), ["atlas", "canis", "orb", "travelers"])
})

test("working pages need only their own object", () => {
  assert.deepEqual(sorted(neededObjects("sky", null, ORDER)), ["atlas"])
  assert.deepEqual(sorted(neededObjects("den", "kennel", ORDER)), ["orb"])
  assert.deepEqual(sorted(neededObjects("quiet", "kennel", ORDER)), [])
})

test("an unknown active section counts as the overture", () => {
  assert.deepEqual(sorted(neededObjects("edition", "nope", ORDER)), ["canis", "hound"])
})
