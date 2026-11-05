import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL is not set")

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

const DEMO_TS = new Date("2031-12-31T23:59:00.000Z")
const DEMO_SYMBOL = "DEMO-CRUD"

function line(title: string) {
  console.log(`\n== ${title} ==`)
}

function errorOf(e: unknown): { code: string; meta: unknown; message: string } {
  const err = e as { code?: string; meta?: unknown; message?: string }
  return { code: err.code ?? "?", meta: err.meta ?? null, message: err.message ?? String(e) }
}

async function main() {
  // Reset anything left over from an interrupted run.
  await prisma.scan.deleteMany({ where: { scannerTs: DEMO_TS } })
  await prisma.watchlistItem.deleteMany({ where: { symbol: DEMO_SYMBOL } })

  line("CREATE Scan + nested ScanCoin")
  const scan = await prisma.scan.create({
    data: {
      scannerTs: DEMO_TS,
      minApr: 1,
      holdHours: 72,
      costPct: 0.3,
      leverage: 2,
      meta: { divisor: 8, skipped_zero: [], skipped_young: [], skipped_thin: [] },
      coins: {
        create: [
          { symbol: "BTC", grossApr: 42.4, netApr: 39.8, persistence: 0.93, samples: 144, long: "Lighter", short: "Binance", liqDist: 0.08, stale: false, hoursSinceFlip: 31.5, windowH: 6, n24: 144, status: "ok" },
          { symbol: "ETH", grossApr: 31.2, netApr: 28.6, persistence: 0.9, samples: 144, long: "Lighter", short: "Binance", liqDist: 0.07, stale: false, hoursSinceFlip: 20.1, windowH: 6, n24: 144, status: "ok" },
        ],
      },
    },
    include: { coins: true },
  })
  console.log(`Scan ${scan.id} created with ${scan.coins.length} coins: ${scan.coins.map((c) => c.symbol).join(", ")}`)

  line("READ Scan by id (include coins)")
  const read = await prisma.scan.findUnique({ where: { id: scan.id }, include: { coins: true } })
  console.log(`scannerTs=${read?.scannerTs.toISOString()} coins=${read?.coins.map((c) => `${c.symbol}:${c.netApr}`).join(" ")}`)

  line("UPDATE ScanCoin netApr")
  const btc = scan.coins.find((c) => c.symbol === "BTC")!
  const updated = await prisma.scanCoin.update({ where: { id: btc.id }, data: { netApr: 41.1 } })
  console.log(`${updated.symbol} netApr ${btc.netApr} -> ${updated.netApr}`)

  line("P2002: duplicate WatchlistItem.symbol")
  await prisma.watchlistItem.create({ data: { symbol: DEMO_SYMBOL, note: "first" } })
  try {
    await prisma.watchlistItem.create({ data: { symbol: DEMO_SYMBOL, note: "second" } })
    console.log("unexpected: duplicate accepted")
  } catch (e) {
    const err = errorOf(e)
    console.log(`code=${err.code} meta=${JSON.stringify(err.meta)}`)
    console.log(`message=${err.message}`)
  }

  line("P2025: update a Scan that does not exist")
  try {
    await prisma.scan.update({ where: { id: "no-such-scan" }, data: { minApr: 2 } })
    console.log("unexpected: update accepted")
  } catch (e) {
    const err = errorOf(e)
    console.log(`code=${err.code} meta=${JSON.stringify(err.meta)}`)
    console.log(`message=${err.message}`)
  }

  line("DELETE ScanCoin then DELETE Scan (cascade check)")
  const eth = scan.coins.find((c) => c.symbol === "ETH")!
  await prisma.scanCoin.delete({ where: { id: eth.id } })
  await prisma.scan.delete({ where: { id: scan.id } })
  const left = await prisma.scanCoin.count({ where: { scanId: scan.id } })
  console.log(`Scan ${scan.id} deleted; remaining ScanCoin rows for it: ${left}`)

  line("P2025: delete the same Scan again")
  try {
    await prisma.scan.delete({ where: { id: scan.id } })
    console.log("unexpected: second delete accepted")
  } catch (e) {
    const err = errorOf(e)
    console.log(`code=${err.code} meta=${JSON.stringify(err.meta)}`)
    console.log(`message=${err.message}`)
  }

  await prisma.watchlistItem.deleteMany({ where: { symbol: DEMO_SYMBOL } })
  line("done")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
