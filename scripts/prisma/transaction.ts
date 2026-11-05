import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL is not set")

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

const DEMO_TS = new Date("2032-01-01T00:00:00.000Z")
const TICKET_SYMBOL = "DEMO-TX"

function line(title: string) {
  console.log(`\n== ${title} ==`)
}

function errorOf(e: unknown): { code: string; meta: unknown; message: string } {
  const err = e as { code?: string; meta?: unknown; message?: string }
  return { code: err.code ?? "?", meta: err.meta ?? null, message: err.message ?? String(e) }
}

async function reset() {
  await prisma.paperOutcome.deleteMany({ where: { ticket: { symbol: TICKET_SYMBOL } } })
  await prisma.paperTicket.deleteMany({ where: { symbol: TICKET_SYMBOL } })
  await prisma.scan.deleteMany({ where: { scannerTs: DEMO_TS } })
}

async function counts() {
  const [scans, coins, tickets, outcomes] = await Promise.all([
    prisma.scan.count(),
    prisma.scanCoin.count(),
    prisma.paperTicket.count(),
    prisma.paperOutcome.count(),
  ])
  return { scans, coins, tickets, outcomes }
}

async function main() {
  await reset()

  line("RESTRICT: delete PaperTicket while its PaperOutcome exists (no transaction)")
  const ticket = await prisma.paperTicket.create({
    data: { symbol: TICKET_SYMBOL, side: "long", notionalUsd: 1000, leverage: 2, holdHours: 72, note: "rollback demo" },
  })
  await prisma.paperOutcome.create({
    data: { ticketId: ticket.id, status: "open", openedAt: new Date("2032-01-01T00:00:00.000Z") },
  })
  console.log(`before: ${JSON.stringify(await counts())}`)
  try {
    await prisma.paperTicket.delete({ where: { id: ticket.id } })
    console.log("unexpected: ticket deleted")
  } catch (e) {
    const err = errorOf(e)
    console.log(`code=${err.code} meta=${JSON.stringify(err.meta)}`)
    console.log(`message=${err.message}`)
  }
  console.log(`after failed delete: ${JSON.stringify(await counts())}`)

  line("Same delete in one transaction (outcome first, then ticket)")
  await prisma.$transaction([
    prisma.paperOutcome.delete({ where: { ticketId: ticket.id } }),
    prisma.paperTicket.delete({ where: { id: ticket.id } }),
  ])
  console.log(`after transaction: ${JSON.stringify(await counts())}`)

  line("ROLLBACK: duplicate ScanCoin inside $transaction")
  const before = await counts()
  console.log(`before: ${JSON.stringify(before)}`)
  try {
    await prisma.$transaction(async (tx) => {
      const scan = await tx.scan.create({
        data: { scannerTs: DEMO_TS, minApr: 1, holdHours: 72, costPct: 0.3, leverage: 2, meta: { divisor: 8 } },
      })
      await tx.scanCoin.create({
        data: { scanId: scan.id, symbol: "BTC", grossApr: 42.4, netApr: 39.8, persistence: 0.93, samples: 144, long: "Lighter", short: "Binance", liqDist: 0.08, stale: false, hoursSinceFlip: 31.5, windowH: 6, n24: 144, status: "ok" },
      })
      await tx.scanCoin.create({
        data: { scanId: scan.id, symbol: "BTC", grossApr: 1, netApr: 1, persistence: 0.1, samples: 1, long: "Lighter", short: "Binance", liqDist: 0.01, stale: false, hoursSinceFlip: 1, windowH: 6, n24: 1, status: "ok" },
      })
    })
  } catch (e) {
    const err = errorOf(e)
    console.log(`rolled back: code=${err.code} meta=${JSON.stringify(err.meta)}`)
  }
  console.log(`after rollback: ${JSON.stringify(await counts())}`)

  line("WITHOUT transaction: the same duplicate leaves an orphan Scan")
  const scan = await prisma.scan.create({
    data: { scannerTs: DEMO_TS, minApr: 1, holdHours: 72, costPct: 0.3, leverage: 2, meta: { divisor: 8 } },
  })
  await prisma.scanCoin.create({
    data: { scanId: scan.id, symbol: "BTC", grossApr: 42.4, netApr: 39.8, persistence: 0.93, samples: 144, long: "Lighter", short: "Binance", liqDist: 0.08, stale: false, hoursSinceFlip: 31.5, windowH: 6, n24: 144, status: "ok" },
  })
  try {
    await prisma.scanCoin.create({
      data: { scanId: scan.id, symbol: "BTC", grossApr: 1, netApr: 1, persistence: 0.1, samples: 1, long: "Lighter", short: "Binance", liqDist: 0.01, stale: false, hoursSinceFlip: 1, windowH: 6, n24: 1, status: "ok" },
    })
  } catch (e) {
    console.log(`code=${errorOf(e).code}`)
  }
  const orphan = await prisma.scan.findUnique({ where: { id: scan.id }, include: { coins: true } })
  console.log(`orphan Scan still present: ${orphan?.id}, coins=${orphan?.coins.length}`)
  await prisma.scan.delete({ where: { id: scan.id } })

  line("CASCADE: deleting a Scan removes its ScanCoin rows")
  const keep = await prisma.scan.create({
    data: {
      scannerTs: DEMO_TS,
      minApr: 1,
      holdHours: 72,
      costPct: 0.3,
      leverage: 2,
      meta: { divisor: 8 },
      coins: { create: [{ symbol: "BTC", grossApr: 42.4, netApr: 39.8, persistence: 0.93, samples: 144, long: "Lighter", short: "Binance", liqDist: 0.08, stale: false, hoursSinceFlip: 31.5, windowH: 6, n24: 144, status: "ok" }] },
    },
  })
  await prisma.scan.delete({ where: { id: keep.id } })
  console.log(`ScanCoin rows left for deleted Scan: ${await prisma.scanCoin.count({ where: { scanId: keep.id } })}`)

  await reset()
  line("done")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
