/**
 * Migrates legacy order statuses before prisma db push.
 * Run: node scripts/migrate-order-status.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const updates = [
    [`UPDATE "Order" SET status = 'APPROVED_PAID' WHERE status = 'APPROVED' AND paymentStatus = 'PAID'`, "APPROVED+PAID → APPROVED_PAID"],
    [`UPDATE "Order" SET status = 'APPROVED_UNPAID' WHERE status = 'APPROVED'`, "APPROVED → APPROVED_UNPAID"],
    [`UPDATE "Order" SET status = 'COMPLETED' WHERE status = 'FULFILLED'`, "FULFILLED → COMPLETED"],
  ];

  for (const [sql, label] of updates) {
    try {
      const count = await prisma.$executeRawUnsafe(sql);
      console.log(`${label}: ${count} row(s)`);
    } catch (e) {
      console.warn(`${label}: skipped (${e instanceof Error ? e.message : e})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
