import { PrismaClient } from "@prisma/client";
import { DEFAULT_GST_RATE_BPS } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.product.groupBy({
    by: ["gstRateBps"],
    _count: { _all: true },
  });
  console.log("GST rates before:", before);

  const updated = await prisma.product.updateMany({
    data: { gstRateBps: DEFAULT_GST_RATE_BPS },
  });
  console.log(`Updated ${updated.count} products to ${DEFAULT_GST_RATE_BPS / 100}% GST`);

  const after = await prisma.product.groupBy({
    by: ["gstRateBps"],
    _count: { _all: true },
  });
  console.log("GST rates after:", after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
