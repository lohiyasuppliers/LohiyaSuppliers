import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { PRODUCT_LEVEL_VARIATION_ID } from "@/lib/constants";
import { rupeesToPaise } from "@/lib/money";
import {
  getClientProductDiscountRules,
  type ProductDiscountRuleRow,
} from "@/lib/discount-rules";
import {
  countProductDiscountRules,
  deleteProductDiscountRule,
  upsertProductDiscountRule,
} from "@/lib/product-discount-sync";
import { DiscountType, Role } from "@prisma/client";

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

type DiscountRuleMapValue = {
  type: DiscountType;
  valuePaise: number | null;
  valueBps: number | null;
};

function mapProductRow(
  p: ProductWithRelations,
  ruleMap: Map<string, DiscountRuleMapValue>,
  options?: { variationsOnlyWithRules?: boolean }
) {
  const productRule = ruleMap.get(`${p.id}:${PRODUCT_LEVEL_VARIATION_ID}`) ?? null;

  const allVariations = p.variations.map((v) => {
    const rule = ruleMap.get(`${p.id}:${v.id}`) ?? null;
    return {
      id: v.id,
      sku: v.sku,
      attributes: v.attributes,
      defaultPricePaise: v.defaultPricePaise ?? p.defaultPricePaise,
      discountType: rule?.type ?? null,
      discountValuePaise: rule?.valuePaise ?? null,
      discountValueBps: rule?.valueBps ?? null,
    };
  });

  const variations = options?.variationsOnlyWithRules
    ? allVariations.filter((v) => v.discountValuePaise != null || v.discountValueBps != null)
    : allVariations;

  const hasRule =
    productRule != null ||
    variations.some((v) => v.discountValuePaise != null || v.discountValueBps != null);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category.name,
    defaultPricePaise: p.defaultPricePaise,
    discountType: productRule?.type ?? null,
    discountValuePaise: productRule?.valuePaise ?? null,
    discountValueBps: productRule?.valueBps ?? null,
    variations,
    hasRule,
  };
}

async function buildCustomProducts(
  ruleRows: ProductDiscountRuleRow[],
  ruleMap: Map<string, DiscountRuleMapValue>
) {
  const productIds = [...new Set(ruleRows.map((r) => r.productId))];
  if (productIds.length === 0) return [];
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
    .map((p) => mapProductRow(p, ruleMap, { variationsOnlyWithRules: true }))
    .filter((p) => p.hasRule);
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
    return NextResponse.json({ error: "Discount is only for B2B clients" }, { status: 400 });
  }

  const rules = await getClientProductDiscountRules(id);
  const ruleMap = new Map<string, DiscountRuleMapValue>(
    rules.map((r) => [
      `${r.productId}:${r.variationId}`,
      { type: r.type, valuePaise: r.valuePaise, valueBps: r.valueBps },
    ])
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
    products = all.map((p) => mapProductRow(p, ruleMap));
  } else {
    products = await buildCustomProducts(rules, ruleMap);
  }

  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean) as string[])].sort();
  const categories = [...new Set(products.map((p) => p.category))].sort();

  return NextResponse.json({
    client: user,
    scope,
    ruleCount: rules.length,
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
    return NextResponse.json({ error: "Discount is only for B2B clients" }, { status: 400 });
  }

  const body = await req.json();
  const { rules: incoming } = body;
  if (!Array.isArray(incoming)) {
    return NextResponse.json({ error: "Invalid rules" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const row of incoming) {
      const { productId, variationId, discountRupees } = row;
      if (!productId || !variationId) continue;

      if (discountRupees === null || discountRupees === "" || discountRupees === undefined) {
        await deleteProductDiscountRule(id, productId, variationId, tx);
        continue;
      }

      const amount = Number(discountRupees);
      if (Number.isNaN(amount) || amount < 0) continue;

      const valuePaise = rupeesToPaise(amount);
      await upsertProductDiscountRule(id, productId, variationId, valuePaise, tx);
    }
  });

  const count =
    (await countProductDiscountRules(id)) ??
    (await prisma.cashbackRule.count({ where: { clientId: id, isActive: true } }));
  return NextResponse.json({ success: true, ruleCount: count });
}
