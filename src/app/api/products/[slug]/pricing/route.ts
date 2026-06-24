import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolvePricesForCatalog } from "@/lib/pricing";
import { getProductListFromPricePaise, getResolvedFromPricePaise } from "@/lib/product-price";
import { cashbackPaiseForLine } from "@/lib/cashback-rules";
import { PRODUCT_LEVEL_VARIATION_ID } from "@/lib/constants";
import { apiError, apiOk } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const clientId =
    session?.user?.role === Role.CLIENT ? (session.user as { id: string }).id : null;

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      defaultPricePaise: true,
      variations: {
        where: { isActive: true },
        select: { id: true, sku: true, attributes: true, defaultPricePaise: true },
        orderBy: { sku: "asc" },
      },
    },
  });

  if (!product) return apiError("Product not found", 404);

  const priceMap = await resolvePricesForCatalog(clientId, [
    {
      id: product.id,
      defaultPricePaise: product.defaultPricePaise,
      variations: product.variations,
    },
  ]);

  const listFromPricePaise = getProductListFromPricePaise(product, product.variations);
  const fromPricePaise = getResolvedFromPricePaise(priceMap, product, product.variations);

  const hasCustom =
    clientId != null &&
    (fromPricePaise !== listFromPricePaise ||
      product.variations.some((v) => {
        const list = v.defaultPricePaise ?? product.defaultPricePaise;
        const resolved = priceMap.get(`${product.id}:${v.id}`) ?? list;
        return resolved !== list;
      }));

  const cashbackRules =
    clientId != null
      ? await prisma.cashbackRule.findMany({
          where: { clientId, productId: product.id, isActive: true },
          select: {
            productId: true,
            variationId: true,
            type: true,
            valuePaise: true,
            valueBps: true,
          },
        })
      : [];

  const productCashbackPaise =
    cashbackRules.length > 0
      ? cashbackPaiseForLine(
          cashbackRules,
          product.id,
          PRODUCT_LEVEL_VARIATION_ID,
          fromPricePaise,
          1
        )
      : 0;

  const variations = product.variations.map((v) => {
    const list = v.defaultPricePaise ?? product.defaultPricePaise;
    const pricePaise = priceMap.get(`${product.id}:${v.id}`) ?? list;
    const cashbackPaise =
      cashbackRules.length > 0
        ? cashbackPaiseForLine(cashbackRules, product.id, v.id, pricePaise, 1)
        : 0;
    return {
      id: v.id,
      sku: v.sku,
      attributes: v.attributes as Record<string, string>,
      pricePaise,
      listPricePaise: list,
      cashbackPaise,
    };
  });

  return apiOk({
    fromPricePaise,
    listFromPricePaise,
    defaultPricePaise: fromPricePaise,
    listPricePaise: listFromPricePaise,
    isCustomPricing: hasCustom,
    productCashbackPaise,
    variations,
  });
}
