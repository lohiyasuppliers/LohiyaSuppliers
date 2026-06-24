import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { PRODUCT_LEVEL_VARIATION_ID } from "@/lib/constants";
import { rupeesToPaise } from "@/lib/money";
import { CashbackType, Role } from "@prisma/client";
import {
  deleteProductDiscountRule,
  syncProductDiscountFromCashback,
} from "@/lib/product-discount-sync";

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

type CashbackRuleMapValue = {
  type: CashbackType;
  valuePaise: number | null;
  valueBps: number | null;
};

function mapProductRow(
  p: ProductWithRelations,
  ruleMap: Map<string, CashbackRuleMapValue>,
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
      cashbackType: rule?.type ?? null,
      cashbackValuePaise: rule?.valuePaise ?? null,
      cashbackValueBps: rule?.valueBps ?? null,
    };
  });

  const variations = options?.variationsOnlyWithRules
    ? allVariations.filter((v) => v.cashbackValuePaise != null || v.cashbackValueBps != null)
    : allVariations;

  const hasRule =
    productRule != null ||
    variations.some((v) => v.cashbackValuePaise != null || v.cashbackValueBps != null);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category.name,
    defaultPricePaise: p.defaultPricePaise,
    cashbackType: productRule?.type ?? null,
    cashbackValuePaise: productRule?.valuePaise ?? null,
    cashbackValueBps: productRule?.valueBps ?? null,
    variations,
    hasRule,
  };
}

async function buildCustomProducts(clientId: string, ruleMap: Map<string, CashbackRuleMapValue>) {
  const rules = await prisma.cashbackRule.findMany({
    where: { clientId, isActive: true },
    select: { productId: true },
    distinct: ["productId"],
  });

  if (rules.length === 0) return [];

  const productIds = rules.map((r) => r.productId);
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
    return NextResponse.json({ error: "Cashback is only for B2B clients" }, { status: 400 });
  }

  const rules = await prisma.cashbackRule.findMany({
    where: { clientId: id, isActive: true },
  });
  const ruleMap = new Map<string, CashbackRuleMapValue>(
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
    products = await buildCustomProducts(id, ruleMap);
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
    return NextResponse.json({ error: "Cashback is only for B2B clients" }, { status: 400 });
  }

  const body = await req.json();
  const { rules: incoming } = body;
  if (!Array.isArray(incoming)) {
    return NextResponse.json({ error: "Invalid rules" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const row of incoming) {
      const { productId, variationId, cashbackRupees } = row;
      if (!productId || !variationId) continue;

      if (cashbackRupees === null || cashbackRupees === "" || cashbackRupees === undefined) {
        await tx.cashbackRule.deleteMany({
          where: { clientId: id, productId, variationId },
        });
        await deleteProductDiscountRule(id, productId, variationId, tx);
        continue;
      }

      const amount = Number(cashbackRupees);
      if (Number.isNaN(amount) || amount < 0) continue;

      const valuePaise = rupeesToPaise(amount);
      await tx.cashbackRule.upsert({
        where: {
          clientId_productId_variationId: { clientId: id, productId, variationId },
        },
        update: {
          type: CashbackType.FIXED,
          valuePaise,
          valueBps: null,
          isActive: true,
        },
        create: {
          clientId: id,
          productId,
          variationId,
          type: CashbackType.FIXED,
          valuePaise,
          isActive: true,
        },
      });

      await syncProductDiscountFromCashback(id, productId, variationId, valuePaise, tx);
    }
  });

  const count = await prisma.cashbackRule.count({
    where: { clientId: id, isActive: true },
  });
  return NextResponse.json({ success: true, ruleCount: count });
}
