import { prisma } from "./prisma";
import { PRODUCT_LEVEL_VARIATION_ID } from "./constants";

export interface ResolvePriceInput {
  clientId?: string | null;
  productId: string;
  variationId?: string | null;
}

/**
 * Resolve the unit price (paise) a client sees.
 * Priority:
 * 1. Client-specific variation override
 * 2. Client-specific product override
 * 3. Variation default price
 * 4. Product default price
 */
export async function resolvePrice(input: ResolvePriceInput): Promise<number> {
  const { clientId, productId, variationId } = input;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variations: variationId
        ? { where: { id: variationId, isActive: true } }
        : { where: { isActive: true } },
    },
  });

  if (!product || !product.isActive) {
    throw new Error("Product not found or inactive");
  }

  const variation = variationId
    ? product.variations.find((v) => v.id === variationId)
    : undefined;

  if (variationId && !variation) {
    throw new Error("Variation not found or inactive");
  }

  if (clientId) {
    if (variationId) {
      const variationOverride = await prisma.clientPriceOverride.findUnique({
        where: {
          clientId_productId_variationId: {
            clientId,
            productId,
            variationId,
          },
        },
      });
      if (variationOverride) return variationOverride.pricePaise;
    }

    const productOverride = await prisma.clientPriceOverride.findUnique({
      where: {
        clientId_productId_variationId: {
          clientId,
          productId,
          variationId: PRODUCT_LEVEL_VARIATION_ID,
        },
      },
    });
    if (productOverride) return productOverride.pricePaise;
  }

  if (variation?.defaultPricePaise != null) {
    return variation.defaultPricePaise;
  }

  return product.defaultPricePaise;
}

/** Batch-resolve prices for catalog listing (avoids N+1). */
export async function resolvePricesForCatalog(
  clientId: string | null | undefined,
  products: Array<{
    id: string;
    defaultPricePaise: number;
    variations: Array<{ id: string; defaultPricePaise: number | null }>;
  }>
): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();

  if (!clientId) {
    for (const p of products) {
      priceMap.set(p.id, p.defaultPricePaise);
      for (const v of p.variations) {
        priceMap.set(`${p.id}:${v.id}`, v.defaultPricePaise ?? p.defaultPricePaise);
      }
    }
    return priceMap;
  }

  const overrides = await prisma.clientPriceOverride.findMany({
    where: { clientId, productId: { in: products.map((p) => p.id) } },
  });

  const overrideMap = new Map(
    overrides.map((o) => [`${o.productId}:${o.variationId}`, o.pricePaise])
  );

  for (const p of products) {
    const productKey = `${p.id}:${PRODUCT_LEVEL_VARIATION_ID}`;
    priceMap.set(
      p.id,
      overrideMap.get(productKey) ?? p.defaultPricePaise
    );

    for (const v of p.variations) {
      const varKey = `${p.id}:${v.id}`;
      priceMap.set(
        `${p.id}:${v.id}`,
        overrideMap.get(varKey) ??
          overrideMap.get(productKey) ??
          v.defaultPricePaise ??
          p.defaultPricePaise
      );
    }
  }

  return priceMap;
}
