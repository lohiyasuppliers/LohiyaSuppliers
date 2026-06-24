import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, parseJsonBody } from "@/lib/api";
import { resolvePricesForCatalog } from "@/lib/pricing";
import { getProductListFromPricePaise } from "@/lib/product-price";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== Role.CLIENT) {
    return apiOk({ prices: {} });
  }

  const body = await parseJsonBody<{ productIds: string[] }>(req);
  if (!body?.productIds?.length) return apiError("No product IDs");

  const productIds = [...new Set(body.productIds)].slice(0, 100);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: {
      id: true,
      defaultPricePaise: true,
      variations: {
        where: { isActive: true },
        select: { id: true, defaultPricePaise: true },
      },
    },
  });

  const priceMap = await resolvePricesForCatalog(session.user.id, products);
  const prices: Record<string, number> = {};

  for (const p of products) {
    const listFrom = getProductListFromPricePaise(p, p.variations);
    prices[p.id] = priceMap.get(p.id) ?? listFrom;
  }

  return apiOk({ prices });
}
