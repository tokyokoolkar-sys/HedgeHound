-- CreateEnum
CREATE TYPE "ScanCoinStatus" AS ENUM ('ok', 'building history');

-- CreateEnum
CREATE TYPE "PaperOutcomeStatus" AS ENUM ('open', 'closed');

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "scannerTs" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minApr" DOUBLE PRECISION NOT NULL,
    "holdHours" INTEGER NOT NULL,
    "costPct" DOUBLE PRECISION NOT NULL,
    "leverage" DOUBLE PRECISION NOT NULL,
    "meta" JSONB NOT NULL,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanCoin" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "grossApr" DOUBLE PRECISION NOT NULL,
    "netApr" DOUBLE PRECISION NOT NULL,
    "persistence" DOUBLE PRECISION NOT NULL,
    "samples" INTEGER NOT NULL,
    "long" TEXT NOT NULL,
    "short" TEXT NOT NULL,
    "liqDist" DOUBLE PRECISION NOT NULL,
    "stale" BOOLEAN NOT NULL,
    "avgSpreadHr" DOUBLE PRECISION,
    "avgAprSigned" DOUBLE PRECISION,
    "hoursSinceFlip" DOUBLE PRECISION NOT NULL,
    "windowH" DOUBLE PRECISION NOT NULL,
    "n24" INTEGER NOT NULL,
    "status" "ScanCoinStatus" NOT NULL,
    "lighterHr" DOUBLE PRECISION,
    "binanceHr" DOUBLE PRECISION,
    "lighterVol24Usd" DOUBLE PRECISION,
    "lighterOiUsd" DOUBLE PRECISION,
    "binanceVol24Usd" DOUBLE PRECISION,
    "binanceOiUsd" DOUBLE PRECISION,

    CONSTRAINT "ScanCoin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperOutcome" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "status" "PaperOutcomeStatus" NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "realizedFundingUsd" DOUBLE PRECISION,
    "realizedPnlUsd" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaperOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scan_scannerTs_key" ON "Scan"("scannerTs");

-- CreateIndex
CREATE INDEX "ScanCoin_symbol_idx" ON "ScanCoin"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "ScanCoin_scanId_symbol_key" ON "ScanCoin"("scanId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_symbol_key" ON "WatchlistItem"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "PaperOutcome_ticketId_key" ON "PaperOutcome"("ticketId");

-- AddForeignKey
ALTER TABLE "ScanCoin" ADD CONSTRAINT "ScanCoin_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperOutcome" ADD CONSTRAINT "PaperOutcome_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "PaperTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
