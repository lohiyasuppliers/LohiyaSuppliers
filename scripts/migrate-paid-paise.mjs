/** Set paidPaise on existing orders after schema migration. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const paid = await prisma.$executeRawUnsafe(
    `UPDATE "Order" SET paidPaise = totalPaise WHERE paymentStatus = 'PAID'`
  );
  console.log(`Synced paidPaise for PAID orders: ${paid} row(s)`);

  const partial = await prisma.$executeRawUnsafe(
    `UPDATE "Order" SET paymentStatus = 'PARTIAL' WHERE paidPaise > 0 AND paidPaise < totalPaise`
  );
  console.log(`Marked PARTIAL status: ${partial} row(s)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
