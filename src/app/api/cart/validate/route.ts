import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolvePricesForLineItems, unitPriceFromMap } from "@/lib/pricing";
import { apiError, apiOk, parseJsonBody } from "@/lib/api";
import { Role } from "@prisma/client";

interface CartLine {
  productId: string;
  variationId?: string;
  quantity: number;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const clientId =
    session?.user?.role === Role.CLIENT ? (session.user as { id: string }).id : null;

  const body = await parseJsonBody<{ items: CartLine[] }>(req);
  if (!body?.items?.length) return apiError("No items provided");

  const productIds = [...new Set(body.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: {
      variations: { where: { isActive: true } },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  const priceMap = await resolvePricesForLineItems(
    clientId,
    products.map((p) => ({
      id: p.id,
      defaultPricePaise: p.defaultPricePaise,
      variations: p.variations.map((v) => ({
        id: v.id,
        defaultPricePaise: v.defaultPricePaise,
      })),
    }))
  );

  let subtotalPaise = 0;
  let taxPaise = 0;
  const lines = [];

  for (const item of body.items) {
    const product = productMap.get(item.productId);
    if (!product) return apiError(`Product ${item.productId} not found or inactive`);

    const variation = item.variationId
      ? product.variations.find((v) => v.id === item.variationId)
      : undefined;

    if (item.variationId && !variation) {
      return apiError(`Variation not found for ${product.name}`);
    }

    const fallback = variation?.defaultPricePaise ?? product.defaultPricePaise;
    const unitPricePaise = unitPriceFromMap(
      priceMap,
      product.id,
      item.variationId,
      fallback
    );

    const lineSubtotal = unitPricePaise * item.quantity;
    const lineTax = Math.round((lineSubtotal * product.gstRateBps) / 10000);
    subtotalPaise += lineSubtotal;
    taxPaise += lineTax;

    const attrs = variation?.attributes as Record<string, string> | undefined;
    const images = JSON.parse(product.images || "[]") as string[];

    lines.push({
      productId: product.id,
      variationId: variation?.id,
      name: product.name,
      slug: product.slug,
      sku: variation?.sku ?? product.slug.toUpperCase().replace(/-/g, ""),
      variationLabel: attrs ? Object.values(attrs).join(" · ") : undefined,
      pricePaise: unitPricePaise,
      listPricePaise: fallback,
      isCustomPrice: clientId != null && unitPricePaise !== fallback,
      gstRateBps: product.gstRateBps,
      quantity: item.quantity,
      image: images[0],
      lineTotalPaise: lineSubtotal,
    });
  }

  return apiOk({
    items: lines,
    subtotalPaise,
    taxPaise,
    totalPaise: subtotalPaise + taxPaise,
    isCustomPricing: clientId != null && lines.some((l) => l.isCustomPrice),
  });
}
