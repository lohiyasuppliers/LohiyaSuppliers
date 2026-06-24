import { prisma } from "../src/lib/prisma";
import { syncProductDefaultPriceFromVariations } from "../src/lib/product-price";

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, defaultPricePaise: true },
  });

  for (const p of products) {
    const synced = await syncProductDefaultPriceFromVariations(p.id);
    if (synced !== p.defaultPricePaise) {
      console.log(`${p.name}: ${p.defaultPricePaise} -> ${synced}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
