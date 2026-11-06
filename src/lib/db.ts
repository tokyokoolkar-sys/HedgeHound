import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

type PrismaLogLevel = "query" | "info" | "warn" | "error";

const logLevels: PrismaLogLevel[] =
  process.env.PRISMA_LOG === "1"
    ? ["query", "info", "warn", "error"]
    : ["warn", "error"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
    log: logLevels,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;