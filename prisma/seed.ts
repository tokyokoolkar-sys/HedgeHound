import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL is not set")

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

type SeedCoin = {
  symbol: string
  grossApr: number
  netApr: number
  persistence: number
  samples: number
  long: string
  short: string
  liqDist: number
  stale: boolean
  avgSpreadHr: number | null
  avgAprSigned: number | null
  hoursSinceFlip: number
  windowH: number
  n24: number
  status: "ok" | "building_history"
  lighterHr: number | null
  binanceHr: number | null
  lighterVol24Usd: number | null
  lighterOiUsd: number | null
  binanceVol24Usd: number | null
  binanceOiUsd: number | null
}

type SeedScan = {
  scannerTs: Date
  minApr: number
  holdHours: number
  costPct: number
  leverage: number
  meta: { divisor: number; skipped_zero: string[]; skipped_young: string[]; skipped_thin: string[] }
  coins: SeedCoin[]
}

function coin(symbol: string, grossApr: number, netApr: number, status: "ok" | "building_history", n24: number): SeedCoin {
  return {
    symbol,
    grossApr,
    netApr,
    persistence: status === "ok" ? 0.93 : 0.41,
    samples: n24,
    long: "Lighter",
    short: "Binance",
    liqDist: 0.084,
    stale: false,
    avgSpreadHr: status === "ok" ? grossApr / 8 / 24 : null,
    avgAprSigned: status === "ok" ? grossApr : null,
    hoursSinceFlip: 31.5,
    windowH: 6,
    n24,
    status,
    lighterHr: 0.0001,
    binanceHr: 0.0003,
    lighterVol24Usd: 1_250_000,
    lighterOiUsd: 2_400_000,
    binanceVol24Usd: 980_000,
    binanceOiUsd: 1_700_000,
  }
}

const scans: SeedScan[] = [
  {
    scannerTs: new Date("2026-01-01T00:00:00.000Z"),
    minApr: 1,
    holdHours: 72,
    costPct: 0.3,
    leverage: 2,
    meta: { divisor: 8, skipped_zero: ["DOGE"], skipped_young: ["NEWT"], skipped_thin: [] },
    coins: [
      coin("BTC", 42.4, 39.8, "ok", 144),
      coin("ETH", 31.2, 28.6, "ok", 144),
      coin("SOL", 12.8, 9.1, "building_history", 96),
    ],
  },
  {
    scannerTs: new Date("2026-01-01T00:05:00.000Z"),
    minApr: 1,
    holdHours: 72,
    costPct: 0.3,
    leverage: 2,
    meta: { divisor: 8, skipped_zero: ["DOGE"], skipped_young: ["NEWT"], skipped_thin: ["WIF"] },
    coins: [
      coin("BTC", 44.1, 41.5, "ok", 145),
      coin("ETH", 30.7, 27.9, "ok", 145),
      coin("SOL", 13.4, 9.7, "building_history", 97),
      coin("WIF", 8.6, 4.2, "building_history", 88),
    ],
  },
]

async function main() {
  for (const scan of scans) {
    const saved = await prisma.scan.upsert({
      where: { scannerTs: scan.scannerTs },
      update: {
        minApr: scan.minApr,
        holdHours: scan.holdHours,
        costPct: scan.costPct,
        leverage: scan.leverage,
        meta: scan.meta,
      },
      create: {
        scannerTs: scan.scannerTs,
        minApr: scan.minApr,
        holdHours: scan.holdHours,
        costPct: scan.costPct,
        leverage: scan.leverage,
        meta: scan.meta,
      },
    })

    for (const c of scan.coins) {
      await prisma.scanCoin.upsert({
        where: { scanId_symbol: { scanId: saved.id, symbol: c.symbol } },
        update: c,
        create: { ...c, scanId: saved.id },
      })
    }
  }

  for (const [symbol, note] of [
    ["BTC", "watch the funding flip"],
    ["ETH", "calmer spread"],
    ["SOL", "history still building"],
  ] as const) {
    await prisma.watchlistItem.upsert({
      where: { symbol },
      update: { note },
      create: { symbol, note },
    })
  }

  const tickets = [
    { id: "seed-ticket-btc", symbol: "BTC", side: "long" as const, notionalUsd: 2000, leverage: 2, holdHours: 72, note: "funding flip watch" },
    { id: "seed-ticket-eth", symbol: "ETH", side: "short" as const, notionalUsd: 1500, leverage: 1.5, holdHours: 24, note: "calmer spread" },
    { id: "seed-ticket-sol", symbol: "SOL", side: "long" as const, notionalUsd: 800, leverage: 1, holdHours: 48, note: "history still building" },
    { id: "seed-ticket-wif", symbol: "WIF", side: "short" as const, notionalUsd: 500, leverage: 1, holdHours: 16, note: null },
  ]

  for (const ticket of tickets) {
    await prisma.paperTicket.upsert({
      where: { id: ticket.id },
      update: ticket,
      create: ticket,
    })
  }

  await prisma.paperOutcome.upsert({
    where: { ticketId: "seed-ticket-btc" },
    update: { note: "Opened before the flip; funding stayed positive." },
    create: {
      ticketId: "seed-ticket-btc",
      status: "open",
      note: "Opened before the flip; funding stayed positive.",
      openedAt: new Date("2026-01-02T00:00:00.000Z"),
    },
  })

  const [scansCount, coinsCount, watchCount, ticketCount, outcomeCount] = await Promise.all([
    prisma.scan.count(),
    prisma.scanCoin.count(),
    prisma.watchlistItem.count(),
    prisma.paperTicket.count(),
    prisma.paperOutcome.count(),
  ])
  console.log(
    `seed ok: ${scansCount} scans, ${coinsCount} scan coins, ${watchCount} watchlist items, ${ticketCount} paper tickets, ${outcomeCount} outcomes`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
