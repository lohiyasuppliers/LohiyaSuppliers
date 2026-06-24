import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { PRODUCT_LEVEL_VARIATION_ID } from "@/lib/constants";
import { rupeesToPaise } from "@/lib/money";
import { Role } from "@prisma/client";
import { revalidateProductCatalog } from "@/lib/revalidate-catalog";

type ProductWithRelations = Awaited<
  ReturnType<
    typeof prisma.product.findMany<{
      include: {
        category: { select: { name: true } };
        variations: {
          where: { isActive: true };
          orderBy: { sku: "asc" };
          select: {
            id: true;
            sku: true;
            attributes: true;
            defaultPricePaise: true;
          };
        };
      };
    }>
  >
>[number];

function mapProductRow(
  p: ProductWithRelations,
  overrideMap: Map<string, number>,
  options?: { variationsOnlyWithOverrides?: boolean }
) {
  const customProductPricePaise =
    overrideMap.get(`${p.id}:${PRODUCT_LEVEL_VARIATION_ID}`) ?? null;

  const allVariations = p.variations.map((v) => ({
    id: v.id,
    sku: v.sku,
    attributes: v.attributes,
    defaultPricePaise: v.defaultPricePaise ?? p.defaultPricePaise,
    customPricePaise: overrideMap.get(`${p.id}:${v.id}`) ?? null,
  }));

  const variations = options?.variationsOnlyWithOverrides
    ? allVariations.filter((v) => v.customPricePaise != null)
    : allVariations;

  const hasCustom =
    customProductPricePaise != null || variations.some((v) => v.customPricePaise != null);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category.name,
    defaultPricePaise: p.defaultPricePaise,
    customProductPricePaise,
    variations,
    hasCustom,
  };
}

async function buildCustomProducts(clientId: string, overrideMap: Map<string, number>) {
  const overrides = await prisma.clientPriceOverride.findMany({
    where: { clientId },
    select: { productId: true },
    distinct: ["productId"],
  });

  if (overrides.length === 0) return [];

  const productIds = overrides.map((o) => o.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: {
      category: { select: { name: true } },
      variations: {
        where: { isActive: true },
        orderBy: { sku: "asc" },
        select: {
          id: true,
          sku: true,
          attributes: true,
          defaultPricePaise: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return products
    .map((p) =>
      mapProductRow(p, overrideMap, { variationsOnlyWithOverrides: true })
    )
    .filter((p) => p.hasCustom);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") === "all" ? "all" : "custom";

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, name: true, email: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Pricing is only for B2B clients" }, { status: 400 });
  }

  const overrides = await prisma.clientPriceOverride.findMany({ where: { clientId: id } });
  const overrideMap = new Map(
    overrides.map((o) => [`${o.productId}:${o.variationId}`, o.pricePaise])
  );

  let products;
  if (scope === "all") {
    const all = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        variations: {
          where: { isActive: true },
          orderBy: { sku: "asc" },
          select: {
            id: true,
            sku: true,
            attributes: true,
            defaultPricePaise: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    products = all.map((p) => mapProductRow(p, overrideMap));
  } else {
    products = await buildCustomProducts(id, overrideMap);
  }

  const brands = [
    ...new Set(products.map((p) => p.brand).filter(Boolean) as string[]),
  ].sort();
  const categories = [...new Set(products.map((p) => p.category))].sort();

  return NextResponse.json({
    client: user,
    scope,
    overrideCount: overrides.length,
    brands,
    categories,
    products,
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Pricing is only for B2B clients" }, { status: 400 });
  }

  const body = await req.json();
  const { overrides } = body;
  if (!Array.isArray(overrides)) {
    return NextResponse.json({ error: "Invalid overrides" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const row of overrides) {
      const { productId, variationId, priceRupees } = row;
      if (!productId || !variationId) continue;

      if (priceRupees === null || priceRupees === "" || priceRupees === undefined) {
        await tx.clientPriceOverride.deleteMany({
          where: { clientId: id, productId, variationId },
        });
        continue;
      }

      const price = Number(priceRupees);
      if (Number.isNaN(price) || price < 0) continue;

      const pricePaise = rupeesToPaise(price);
      await tx.clientPriceOverride.upsert({
        where: {
          clientId_productId_variationId: { clientId: id, productId, variationId },
        },
        update: { pricePaise },
        create: { clientId: id, productId, variationId, pricePaise },
      });
    }
  });

  const count = await prisma.clientPriceOverride.count({ where: { clientId: id } });
  revalidateProductCatalog();
  return NextResponse.json({ success: true, overrideCount: count });
}
