import "server-only"

import { prisma } from "../db.ts"
import { pollAndRecord } from "./record.ts"
import type { ScanRecord } from "./record.ts"
import { DEFAULT_SCAN_PARAMS } from "./types.ts"

declare global {
  var __hedgehoundRecordTimer: ReturnType<typeof setInterval> | undefined
}

async function save(record: ScanRecord): Promise<void> {
  try {
    await prisma.scan.create({
      data: {
        scannerTs: record.scannerTs,
        minApr: record.minApr,
        holdHours: record.holdHours,
        costPct: record.costPct,
        leverage: record.leverage,
        meta: record.meta as never,
        coins: {
          create: record.coins.map((c) => ({
            symbol: c.symbol,
            grossApr: c.grossApr,
            netApr: c.netApr,
            persistence: c.persistence,
            samples: c.samples,
            long: c.long,
            short: c.short,
            liqDist: c.liqDist,
            stale: c.stale,
            avgSpreadHr: c.avgSpreadHr,
            avgAprSigned: c.avgAprSigned,
            hoursSinceFlip: c.hoursSinceFlip,
            windowH: c.windowH,
            n24: c.n24,
            status: c.status,
            lighterHr: c.lighterHr,
            binanceHr: c.binanceHr,
            lighterVol24Usd: c.lighterVol24Usd,
            lighterOiUsd: c.lighterOiUsd,
            binanceVol24Usd: c.binanceVol24Usd,
            binanceOiUsd: c.binanceOiUsd,
          })),
        },
      },
    })
  } catch (e) {
    const code = (e as { code?: string })?.code
    if (code === "P2002") return
    const msg = e instanceof Error ? e.message : String(e)
    console.error(msg)
  }
}

export function startRecordJob(): void {
  if (!process.env.DATABASE_URL) return
  if (globalThis.__hedgehoundRecordTimer) return
  const params = { ...DEFAULT_SCAN_PARAMS, min: 0 }
  const tick = async () => {
    await pollAndRecord({ fetchJson: (url, init) => fetch(url, init).then((r) => r.json()), save, params })
  }
  globalThis.__hedgehoundRecordTimer = setInterval(() => {
    void tick()
  }, 60_000)
  void tick()
}