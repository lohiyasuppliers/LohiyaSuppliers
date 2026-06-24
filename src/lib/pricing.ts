import { prisma } from "./prisma";
import { PRODUCT_LEVEL_VARIATION_ID } from "./constants";
import { getProductListFromPricePaise, getResolvedFromPricePaise } from "./product-price";

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
      for (const v of p.variations) {
        priceMap.set(`${p.id}:${v.id}`, v.defaultPricePaise ?? p.defaultPricePaise);
      }
      priceMap.set(
        p.id,
        p.variations.length > 0
          ? getProductListFromPricePaise(p, p.variations)
          : p.defaultPricePaise
      );
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
    const productOverride = overrideMap.get(productKey);

    for (const v of p.variations) {
      const varKey = `${p.id}:${v.id}`;
      priceMap.set(
        varKey,
        overrideMap.get(varKey) ??
          productOverride ??
          v.defaultPricePaise ??
          p.defaultPricePaise
      );
    }

    if (p.variations.length > 0) {
      priceMap.set(p.id, getResolvedFromPricePaise(priceMap, p, p.variations));
    } else {
      priceMap.set(p.id, productOverride ?? p.defaultPricePaise);
    }
  }

  return priceMap;
}

export interface OrderLineInput {
  productId: string;
  variationId?: string | null;
  quantity: number;
}

/** Resolve unit price for a single line using a pre-built price map. */
export function unitPriceFromMap(
  priceMap: Map<string, number>,
  productId: string,
  variationId: string | null | undefined,
  fallbackPaise: number
): number {
  if (variationId) {
    return priceMap.get(`${productId}:${variationId}`) ?? fallbackPaise;
  }
  return priceMap.get(productId) ?? fallbackPaise;
}

/** Props for ProductCard when showing client-specific catalog prices. */
export function catalogPriceProps(
  priceMap: Map<string, number>,
  product: { id: string; defaultPricePaise: number },
  clientId: string | null | undefined,
  listFromPricePaise?: number
) {
  const listPrice = listFromPricePaise ?? product.defaultPricePaise;
  const displayPricePaise = priceMap.get(product.id) ?? listPrice;
  const isCustomPrice = clientId != null && displayPricePaise !== listPrice;
  return { displayPricePaise, isCustomPrice, listFromPricePaise: listPrice };
}

/** Batch-resolve prices for order/cart line items (2 DB queries max). */
export async function resolvePricesForLineItems(
  clientId: string | null | undefined,
  products: Array<{
    id: string;
    defaultPricePaise: number;
    variations: Array<{ id: string; defaultPricePaise: number | null }>;
  }>
): Promise<Map<string, number>> {
  return resolvePricesForCatalog(clientId, products);
}
