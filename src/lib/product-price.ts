import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type VariationPrice = { defaultPricePaise?: number | null; isActive?: boolean };

/** Lowest list/catalog price for a product (min active variation, else product default). */
export function getProductListFromPricePaise(
  product: { defaultPricePaise: number },
  variations: VariationPrice[] = []
): number {
  const active = variations.filter((v) => v.isActive !== false);
  if (active.length === 0) return product.defaultPricePaise;

  const prices = active.map((v) => v.defaultPricePaise ?? product.defaultPricePaise);
  return Math.min(...prices);
}

/** Lowest resolved price from a catalog price map (after B2B overrides). */
export function getResolvedFromPricePaise(
  priceMap: Map<string, number>,
  product: { id: string; defaultPricePaise: number },
  variations: Array<{ id: string; defaultPricePaise: number | null }> = []
): number {
  if (variations.length === 0) {
    return priceMap.get(product.id) ?? product.defaultPricePaise;
  }

  const resolved = variations.map((v) => {
    const list = v.defaultPricePaise ?? product.defaultPricePaise;
    return priceMap.get(`${product.id}:${v.id}`) ?? list;
  });

  return Math.min(...resolved);
}

/** Keep product.defaultPricePaise in sync with the cheapest active variation. */
export async function syncProductDefaultPriceFromVariations(
  productId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  const [product, variations] = await Promise.all([
    db.product.findUnique({
      where: { id: productId },
      select: { defaultPricePaise: true },
    }),
    db.productVariation.findMany({
      where: { productId, isActive: true },
      select: { defaultPricePaise: true },
    }),
  ]);

  if (!product || variations.length === 0) return product?.defaultPricePaise;

  const priced = variations
    .map((v) => v.defaultPricePaise)
    .filter((p): p is number => p != null);

  if (priced.length === 0) return product.defaultPricePaise;

  const minPrice = Math.min(...priced);
  if (minPrice !== product.defaultPricePaise) {
    await db.product.update({
      where: { id: productId },
      data: { defaultPricePaise: minPrice },
    });
  }

  return minPrice;
}
