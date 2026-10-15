import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import { palette } from "./palette.ts"

// palette.ts mirrors the @theme tokens in styles.css. Hex values may only live in those two places,
// so this test is what keeps them in lockstep.

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8")
const theme = css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? ""
const camel = (name: string) => name.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())

const hexTokens = Object.fromEntries(
  [...theme.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map(([, name, hex]) => [camel(name), hex.toLowerCase()]),
)

describe("palette.ts ↔ styles.css @theme", () => {
  it("found the @theme block", () => {
    assert.ok(Object.keys(hexTokens).length >= 7, `only parsed ${Object.keys(hexTokens).length} hex tokens`)
  })

  it("every hex token in styles.css has the same value in palette.ts", () => {
    for (const [name, hex] of Object.entries(hexTokens)) {
      assert.equal(palette[name as keyof typeof palette], hex, `--color-${name}`)
    }
  })

  it("every hex value in palette.ts is a token in styles.css", () => {
    for (const [key, value] of Object.entries(palette)) {
      if (typeof value !== "string") continue
      assert.equal(hexTokens[key], value.toLowerCase(), `palette.${key} has no matching @theme token`)
    }
  })

  it("starlight-dim and -faint are starlight at the palette alphas", () => {
    for (const [token, alpha] of [["dim", palette.starlightDimAlpha], ["faint", palette.starlightFaintAlpha]] as const) {
      const m = theme.match(new RegExp(String.raw`--color-starlight-${token}:\s*rgb\((\d+) (\d+) (\d+) / ([\d.]+)\)`))
      assert.ok(m, `--color-starlight-${token} not found`)
      const hex = `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`
      assert.equal(hex, palette.starlight)
      assert.equal(Number(m[4]), alpha)
    }
  })
})
