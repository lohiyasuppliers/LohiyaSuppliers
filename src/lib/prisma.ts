import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Faster concurrent reads on SQLite (dev + prod). PRAGMA may return rows — use queryRaw. */
if (!(globalThis as { __sqliteTuned?: boolean }).__sqliteTuned) {
  (globalThis as { __sqliteTuned?: boolean }).__sqliteTuned = true;
  void prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL").catch(() => {});
  void prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL").catch(() => {});
  void prisma.$queryRawUnsafe("PRAGMA cache_size = -64000").catch(() => {});
}
