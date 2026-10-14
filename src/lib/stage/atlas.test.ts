import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { CAM_Z, FLY_END, atlasLocal, depthOf, focusTransform, onPlane, placeAtlas, recap } from "./atlas.ts"

const row = (symbol: string, net_apr: number, persistence = 0.5, status = "ok") => ({ symbol, net_apr, persistence, status })

describe("atlas", () => {
  it("puts every coin at a stable spot inside the view", () => {
    const rows = [row("BTC", 5), row("1000PEPE", 46), row("ARB", 30)]
    const a = placeAtlas(rows)
    assert.equal(a.length, 3)
    assert.deepEqual(placeAtlas([...rows].reverse()).find((s) => s.symbol === "ARB"), a.find((s) => s.symbol === "ARB"))
    for (const s of a) assert.ok(Math.abs(s.x) < 1 && Math.abs(s.y) < 1)
  })
  it("twinkle grows with shakiness, size with net", () => {
    const [steady, shaky] = placeAtlas([row("A", 40, 1), row("B", 5, 0.2)])
    assert.equal(steady.shake, 0)
    assert.ok(shaky.shake > 0.7)
    assert.ok(steady.size > shaky.size)
  })
})

describe("atlas recap", () => {
  const rows = [row("1000PEPE", 46, 0.4), row("ARB", 35, 1), row("WIF", 23, 0.96), row("BTC", 5, 0.9)]
  it("merges letters when chapters featured the same coin", () => {
    const r = recap(rows, { loudest: "1000PEPE", steadiest: "ARB", shortlistFirst: "1000PEPE", kennel: ["PEPE", "WIF"] })
    assert.deepEqual(r, [
      { symbol: "1000PEPE", letters: ["β", "γ", "δ", "ε", "ζ"], role: "the loudest" },
      { symbol: "ARB", letters: ["δ"], role: "the one that stayed" },
    ])
  })
  it("skips picks that aren't on the board", () => {
    assert.deepEqual(recap(rows, { loudest: null, steadiest: "NOPE", shortlistFirst: null, kennel: [] }), [])
  })
  describe("focus on /sky", () => {
    const base = { k0: 1, halfW: 7, halfH: 4, fx: 0.5, fy: -0.3, target: [-0.16, 0.1] as [number, number] }
    // The coin's world point under a transform, placed exactly as the atlas places it.
    const coin = (t: ReturnType<typeof focusTransform>, fz: number): [number, number, number] => {
      const [lx, ly] = atlasLocal(base.fx, base.fy, fz, t.scale[0], t.cx)
      return [t.pos[0] + t.scale[0] * lx, t.pos[1] + t.scale[1] * ly, t.pos[2] + fz]
    }
    const near = (a: [number, number], b: [number, number]) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9
    for (const fly of [0, 1])
      for (const inset of [0, 0.3])
        for (const fz of [0, 1.7, -2.5]) {
          const name = `${fly ? "fly" : "reading"} (inset ${inset}, depth ${fz})`
          const hw = 7 * (1 - inset)
          it(`${name}: at rest the coin sits on its flat spot beside the list`, () => {
            assert.ok(near(onPlane(coin(focusTransform({ ...base, inset, f: 0, fly, fz }), fz)), [7 * inset + hw * 0.5, 4 * -0.3]))
          })
          it(`${name}: arrived, the coin sits on the target`, () => {
            assert.ok(near(onPlane(coin(focusTransform({ ...base, inset, f: 1, fly, fz }), fz)), [7 * -0.16, 4 * 0.1]))
          })
        }
    it("fly stops FLY_END in front of the coin; reading stays on the plane", () => {
      const t = focusTransform({ ...base, inset: 0, f: 1, fly: 1, fz: 1.7 })
      assert.ok(Math.abs(CAM_Z - (t.pos[2] + 1.7) - FLY_END) < 1e-9)
      assert.equal(focusTransform({ ...base, inset: 0, f: 1, fly: 0, fz: 1.7 }).pos[2], 0)
    })
    it("depths are stable and stay in front of the camera", () => {
      for (const s of ["BTC", "1000PEPE", "ARB", "WIF"]) {
        assert.equal(depthOf(s), depthOf(s))
        assert.ok(depthOf(s) < CAM_Z - FLY_END - 1)
      }
    })
  })
})
