-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PaperSide" AS ENUM ('long', 'short');

-- CreateTable
CREATE TABLE "PaperTicket" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "PaperSide" NOT NULL,
    "notionalUsd" DOUBLE PRECISION NOT NULL,
    "leverage" DOUBLE PRECISION NOT NULL,
    "holdHours" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperTicket_pkey" PRIMARY KEY ("id")
);
