import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_BOOK, EMBER_REASONS, LAYOUT } from "../scent.ts";
import { colorFor, FULL_BRIGHT_APR, toStars, UNCHARTED_RING, unchartedPos } from "./adapter.ts";
import { normalizeScan, secondsToNextPoll } from "./normalize.ts";
import {
  BACKOFF_STEPS_MS,
  isStale,
  nextMisses,
  refetchIntervalMs,
  SCAN_REFETCH_MS,
  scanKey,
  scanQueryString,
  staleTimeMs,
  STALE_AFTER_MS,
} from "./query.ts";
import { sampleScan } from "./sample.ts";
import type { ScanResult, ScanRow } from "./types.ts";
import { DEFAULT_SCAN_PARAMS } from "./types.ts";

// A real /api/scan response, recorded from the local scanner (see notes/T40.md).
const wire: unknown = JSON.parse(
  readFileSync(new URL("./__fixtures__/scan.json", import.meta.url), "utf8"),
);
const scan = normalizeScan(wire) as ScanResult;

const row = (over: Partial<ScanRow>): ScanRow => ({
  symbol: "TEST",
  gross_apr: 10,
  net_apr: 10,
  persistence: 0.5,
  samples: 70,
  long: "Binance",
  short: "Lighter",
  liq_dist: 49.5,
  stale: false,
  avg_spread_hr: null,
  avg_apr_signed: null,
  hours_since_flip: 1,
  window_h: 1,
  n24: 10,
  status: "building history",
  ...over,
});
const one = (r: ScanRow) => toStars({ rows: [r], meta: {}, live: true }).stars[0];

describe("normalizeScan (the recorded fixture)", () => {
  it("reads the real shape, and reports ts in milliseconds", () => {
    const raw = wire as { ts: number; rows: unknown[] };
    assert.ok(scan);
    assert.equal(scan.rows.length, raw.rows.length);
    assert.equal(scan.ts, Math.round(raw.ts * 1000));
    // Epoch seconds are ~1.7e9; milliseconds ~1.7e12.
    assert.ok((scan.ts as number) > 1e12);
    assert.equal(scan.live, true);
    assert.equal(scan.err, null);
  });

  it("is not LIVE when the scanner reports an error or has not polled yet", () => {
    const base = wire as { rows: unknown[]; meta: unknown };
    const failed = normalizeScan({ ...base, err: "boom", ts: 1_700_000_000 }) as ScanResult;
    assert.equal(failed.live, false);
    assert.equal(failed.err, "boom");
    const cold = normalizeScan({ ...base, err: null, ts: 0 }) as ScanResult;
    assert.equal(cold.live, false);
    assert.equal(cold.ts, null);
  });

  it("rejects bodies that are not a scan and drops rows without core figures", () => {
    assert.equal(normalizeScan(null), null);
    assert.equal(normalizeScan({ rows: "nope" }), null);
    const partial = normalizeScan({
      rows: [{ symbol: "X" }, { symbol: "Y", gross_apr: 1, net_apr: 1, persistence: 0 }],
      err: null,
      ts: 5,
    }) as ScanResult;
    assert.deepEqual(
      partial.rows.map((r) => r.symbol),
      ["Y"],
    );
  });
});

describe("secondsToNextPoll", () => {
  it("counts down the 300 s poll and never goes negative", () => {
    const t0 = 1_000_000_000_000;
    assert.equal(secondsToNextPoll(t0, t0), 300);
    assert.equal(secondsToNextPoll(t0, t0 + 120_000), 180);
    assert.equal(secondsToNextPoll(t0, t0 + 120_500), 180);
    assert.equal(secondsToNextPoll(t0, t0 + 299_999), 1);
    assert.equal(secondsToNextPoll(t0, t0 + 301_000), 0);
    assert.equal(secondsToNextPoll(t0, t0 - 5_000), 300);
  });
});

describe("toStars: live merge", () => {
  const field = toStars(scan);

  it("puts charted coins where the layout map says", () => {
    const sol = field.stars.find((s) => s.symbol === "SOL");
    assert.ok(sol);
    assert.equal(sol.charted, true);
    assert.equal(sol.sector, "canis");
    assert.deepEqual(sol.pos, LAYOUT.SOL.pos);
    assert.equal(sol.blurb, LAYOUT.SOL.blurb);
    const live = scan.rows.find((r) => r.symbol === "SOL") as ScanRow;
    assert.equal(sol.netApr, live.net_apr);
    assert.equal(sol.n24, live.n24);
    assert.equal(field.source, "live");
  });

  it("keeps every row that is not skipped, in the scanner's order", () => {
    const skipped = new Set(field.embers.map((e) => e.symbol));
    const expected = scan.rows.filter((r) => !skipped.has(r.symbol)).map((r) => r.symbol);
    assert.deepEqual(
      field.stars.map((s) => s.symbol),
      expected,
    );
  });

  it("does not file a live coin under the layout's embers sector", () => {
    // BOT is a cold ember in the layout map, but a live row in this recording.
    const bot = field.stars.find((s) => s.symbol === "BOT");
    assert.ok(bot);
    assert.equal(bot.sector, "uncharted");
    assert.equal(bot.charted, false);
  });
});

describe("toStars: Uncharted ring", () => {
  it("places an unknown symbol deterministically, on the ring", () => {
    const a = unchartedPos("NVDA");
    assert.deepEqual(unchartedPos("NVDA"), a);
    assert.notDeepEqual(unchartedPos("INTC"), a);
    const { rMin, rMax, squash } = UNCHARTED_RING;
    const r = Math.hypot(a[0], a[1] / squash);
    assert.ok(r >= rMin - 0.01 && r <= rMax + 0.01, `radius ${r}`);
  });

  it("gives the same position across separate scans", () => {
    const first = toStars(scan).stars.find((s) => s.symbol === "NVDA");
    const second = toStars(normalizeScan(wire) as ScanResult).stars.find((s) => s.symbol === "NVDA");
    assert.ok(first && second);
    assert.equal(first.sector, "uncharted");
    assert.equal(first.charted, false);
    assert.deepEqual(first.pos, second.pos);
    assert.deepEqual(first.pos, unchartedPos("NVDA"));
  });

  it("uses a custom layout when one is passed", () => {
    const layout = {
      NVDA: { sector: "hedge" as const, pos: [1, 2, 3] as [number, number, number], blurb: "x" },
    };
    const star = toStars(scan, layout).stars.find((s) => s.symbol === "NVDA");
    assert.ok(star);
    assert.deepEqual(star.pos, [1, 2, 3]);
    assert.equal(star.sector, "hedge");
  });
});

describe("toStars: embers", () => {
  const field = toStars(scan);
  const meta = scan.meta;

  it("builds embers from meta.skipped_* with the scent.ts reason for each list", () => {
    const zero = field.embers.filter((e) => e.list === "zero");
    const young = field.embers.filter((e) => e.list === "young");
    const thin = field.embers.filter((e) => e.list === "thin");
    assert.deepEqual(
      zero.map((e) => e.symbol),
      meta.skipped_zero,
    );
    assert.deepEqual(
      young.map((e) => e.symbol),
      meta.skipped_young,
    );
    assert.ok(thin.length > 0);
    for (const e of zero) assert.equal(e.reason, EMBER_REASONS.zero);
    for (const e of young) assert.equal(e.reason, EMBER_REASONS.young);
    for (const e of thin) assert.equal(e.reason, EMBER_REASONS.thin);
    for (const e of field.embers) assert.equal(e.sector, "embers");
  });

  it("treats a skipped symbol as an ember even if a stale row is still present", () => {
    const shib = field.embers.find((e) => e.symbol === "1000SHIB");
    assert.ok(shib, "1000SHIB is in skipped_thin");
    assert.equal(
      field.stars.some((s) => s.symbol === "1000SHIB"),
      false,
    );
    assert.equal(shib.charted, true);
    assert.deepEqual(shib.pos, LAYOUT["1000SHIB"].pos);
  });

  it("hashes unknown embers into the ring, and keeps a symbol in one list only", () => {
    const aaoi = field.embers.find((e) => e.symbol === "AAOI");
    assert.ok(aaoi);
    assert.equal(aaoi.charted, false);
    assert.deepEqual(aaoi.pos, unchartedPos("AAOI"));
    const dup = toStars({
      rows: [],
      meta: { skipped_zero: ["ZZZ"], skipped_thin: ["ZZZ"] },
      live: true,
    });
    assert.deepEqual(
      dup.embers.map((e) => [e.symbol, e.list]),
      [["ZZZ", "zero"]],
    );
  });
});

describe("toStars: brightness and twinkle", () => {
  it("brightness = |net_apr| / 60, clamped to 0..1", () => {
    assert.equal(one(row({ net_apr: 30 }))?.brightness, 0.5);
    assert.equal(one(row({ net_apr: -30 }))?.brightness, 0.5);
    assert.equal(one(row({ net_apr: FULL_BRIGHT_APR }))?.brightness, 1);
    assert.equal(one(row({ net_apr: 123.2 }))?.brightness, 1);
    assert.equal(one(row({ net_apr: -500 }))?.brightness, 1);
    assert.equal(one(row({ net_apr: 0 }))?.brightness, 0);
    assert.equal(one(row({ net_apr: Number.NaN }))?.brightness, 0);
  });

  it("twinkle = 1 - persistence, clamped to 0..1", () => {
    assert.equal(one(row({ persistence: 0 }))?.twinkle, 1);
    assert.equal(one(row({ persistence: 1 }))?.twinkle, 0);
    assert.equal(one(row({ persistence: 0.75 }))?.twinkle, 0.25);
    assert.equal(one(row({ persistence: 1.4 }))?.twinkle, 0);
    assert.equal(one(row({ persistence: -0.2 }))?.twinkle, 1);
  });

  it("stays inside 0..1 for every row of the recording", () => {
    for (const s of toStars(scan).stars) {
      assert.ok(s.brightness >= 0 && s.brightness <= 1, s.symbol);
      assert.ok(s.twinkle >= 0 && s.twinkle <= 1, s.symbol);
    }
  });
});

describe("toStars: colour key", () => {
  it("short Lighter is scent, short Binance is scan", () => {
    assert.equal(colorFor({ short: "Lighter" }), "scent");
    assert.equal(colorFor({ short: "Binance" }), "scan");
    assert.equal(one(row({ short: "Lighter", long: "Binance" }))?.color, "scent");
    assert.equal(one(row({ short: "Binance", long: "Lighter" }))?.color, "scan");
  });

  it("is a semantic key and never a hex, for every star", () => {
    const colors = new Set(toStars(scan).stars.map((s) => s.color));
    for (const c of colors) assert.match(c, /^(scent|scan)$/);
    assert.ok(colors.size >= 1);
  });
});

describe("sample fallback", () => {
  it("is labelled: not live, no timestamp", () => {
    const s = sampleScan();
    assert.equal(s.live, false);
    assert.equal(s.ts, null);
    assert.ok(s.err);
    assert.ok(s.rows.length > 0);
  });

  it("is deterministic, so server and client render the same sky", () => {
    assert.deepEqual(sampleScan(), sampleScan());
  });

  it("turns into stars and embers marked sample", () => {
    const field = toStars(sampleScan());
    assert.equal(field.source, "sample");
    assert.ok(field.stars.every((s) => s.charted));
    const lists = Object.fromEntries(field.embers.map((e) => [e.symbol, e.list]));
    assert.deepEqual(lists, { BOT: "zero", H100: "young", DUST: "thin" });
  });
});

describe("scan query: cost", () => {
  it("defaults to the Edition's DEFAULT_BOOK cost, so live and sample nets share one cost", () => {
    assert.equal(DEFAULT_SCAN_PARAMS.cost, DEFAULT_BOOK.cost);
    assert.equal(DEFAULT_SCAN_PARAMS.cost, 0.3);
    assert.equal(DEFAULT_SCAN_PARAMS.hold, DEFAULT_BOOK.hold);
    assert.equal(DEFAULT_SCAN_PARAMS.lev, DEFAULT_BOOK.lev);
  });

  it("sends cost=0.3 with the other knobs", () => {
    const qs = new URLSearchParams(scanQueryString(DEFAULT_SCAN_PARAMS));
    assert.equal(qs.get("cost"), "0.3");
    assert.equal(qs.get("min"), "1");
    assert.equal(qs.get("hold"), "72");
    assert.equal(qs.get("lev"), "2");
  });

  it("puts cost in the query key, so a different cost is a different cache entry", () => {
    const a = scanKey(DEFAULT_SCAN_PARAMS);
    const b = scanKey({ ...DEFAULT_SCAN_PARAMS, cost: 0.2 });
    assert.equal(a[0], "scan");
    assert.equal(a[1].cost, 0.3);
    assert.notDeepEqual(a, b);
    assert.equal(new URLSearchParams(scanQueryString({ ...DEFAULT_SCAN_PARAMS, cost: 0.2 })).get("cost"), "0.2");
  });

  it("the sample fallback is computed at the same cost", () => {
    // ARB sample row: net = gross - cost / hold * 8760.
    const arb = sampleScan().rows.find((r) => r.symbol === "ARB") as ScanRow;
    const drag = (DEFAULT_SCAN_PARAMS.cost / DEFAULT_SCAN_PARAMS.hold) * 8760;
    assert.ok(Math.abs(arb.gross_apr - arb.net_apr - drag) < 0.11);
  });
});

describe("offline backoff", () => {
  it("polls every 30 s while live or before the first answer", () => {
    assert.equal(refetchIntervalMs(undefined), 30_000);
    assert.equal(refetchIntervalMs({ live: true, misses: 0 }), SCAN_REFETCH_MS);
    assert.equal(refetchIntervalMs({ live: true }), 30_000);
  });

  it("walks 30 s, 2 min, 5 min and stays at the 5 min cap", () => {
    assert.deepEqual([...BACKOFF_STEPS_MS], [30_000, 120_000, 300_000]);
    const waits = [1, 2, 3, 4, 5, 50].map((misses) => refetchIntervalMs({ live: false, misses }));
    assert.deepEqual(waits, [30_000, 120_000, 300_000, 300_000, 300_000, 300_000]);
  });

  it("treats a fallback with no count as the first miss", () => {
    assert.equal(refetchIntervalMs({ live: false }), 30_000);
    assert.equal(refetchIntervalMs({ live: false, misses: 0 }), 30_000);
  });

  it("counts consecutive misses and resets on the first live answer", () => {
    let last: { live: boolean; misses: number } | undefined;
    const seen: number[] = [];
    for (const live of [false, false, false, false, true, false]) {
      last = { live, misses: nextMisses(last, { live }) };
      seen.push(refetchIntervalMs(last));
    }
    assert.deepEqual(seen, [30_000, 120_000, 300_000, 300_000, 30_000, 30_000]);
  });

  it("counts the requests in 3 minutes: three, not six", () => {
    // Request at t=0; each answer is a miss and schedules the next one.
    let t = 0;
    let last: { live: boolean; misses: number } | undefined;
    const at: number[] = [];
    while (t <= 180_000) {
      at.push(t);
      last = { live: false, misses: nextMisses(last, { live: false }) };
      t += refetchIntervalMs(last);
    }
    assert.deepEqual(at, [0, 30_000, 150_000]);
  });

  it("holds off focus/remount refetches for the same backoff step while offline", () => {
    assert.equal(staleTimeMs(undefined), 25_000);
    assert.equal(staleTimeMs({ live: true, misses: 0 }), 25_000);
    assert.equal(staleTimeMs({ live: false, misses: 2 }), 120_000);
  });
});

describe("isStale", () => {
  const ts = 1_700_000_000_000;
  it("flags a reading older than 300 s on the client clock", () => {
    assert.equal(STALE_AFTER_MS, 300_000);
    assert.equal(isStale(ts, ts + 300_000), false);
    assert.equal(isStale(ts, ts + 300_001), true);
    assert.equal(isStale(ts, ts + 10_000), false);
  });

  it("is false without a clock (server, first client render) or without a reading", () => {
    assert.equal(isStale(ts, null), false);
    assert.equal(isStale(null, ts), false);
    assert.equal(isStale(ts, ts - 5_000), false);
  });
});
