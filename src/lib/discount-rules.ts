import { DiscountType } from "@prisma/client";
import { prisma } from "./prisma";
import { PRODUCT_LEVEL_VARIATION_ID } from "./constants";
import { applyPercentageDiscountPaise } from "./money";

export const DEFAULT_CASHBACK_EXPIRY_DAYS = 30;

export type ProductDiscountRuleRow = {
  productId: string;
  variationId: string;
  type: DiscountType;
  valuePaise: number | null;
  valueBps: number | null;
};

/** Resolve fixed/percentage discount (paise) for one line item. */
export function discountPaiseForLine(
  rules: ProductDiscountRuleRow[],
  productId: string,
  variationId: string | null | undefined,
  lineTotalPaise: number,
  quantity: number
): number {
  const rule =
    rules.find(
      (r) =>
        r.productId === productId &&
        r.variationId === (variationId ?? PRODUCT_LEVEL_VARIATION_ID)
    ) ??
    rules.find(
      (r) => r.productId === productId && r.variationId === PRODUCT_LEVEL_VARIATION_ID
    );

  if (!rule) return 0;

  if (rule.type === DiscountType.FIXED && rule.valuePaise != null) {
    return Math.max(0, rule.valuePaise * quantity);
  }

  if (rule.type === DiscountType.PERCENTAGE && rule.valueBps != null) {
    return Math.max(0, applyPercentageDiscountPaise(lineTotalPaise, rule.valueBps));
  }

  return 0;
}

export function computeOrderDiscountFromLines(
  items: Array<{
    productId: string;
    variationId: string | null;
    totalPaise: number;
    quantity: number;
    productName?: string;
    variationLabel?: string | null;
  }>,
  rules: ProductDiscountRuleRow[]
) {
  let totalDiscountPaise = 0;
  const lineDiscounts: Array<{
    productId: string;
    variationId: string | null;
    productName: string;
    variationLabel: string | null;
    quantity: number;
    discountPaise: number;
  }> = [];

  for (const item of items) {
    const discountPaise = discountPaiseForLine(
      rules,
      item.productId,
      item.variationId,
      item.totalPaise,
      item.quantity
    );
    if (discountPaise > 0) {
      lineDiscounts.push({
        productId: item.productId,
        variationId: item.variationId,
        productName: item.productName ?? "Product",
        variationLabel: item.variationLabel ?? null,
        quantity: item.quantity,
        discountPaise,
      });
      totalDiscountPaise += discountPaise;
    }
  }

  return { totalDiscountPaise, lineDiscounts };
}

export async function getClientProductDiscountRules(
  clientId: string
): Promise<ProductDiscountRuleRow[]> {
  const select = {
    productId: true,
    variationId: true,
    type: true,
    valuePaise: true,
    valueBps: true,
  } as const;

  try {
    const delegate = (prisma as { productDiscountRule?: { findMany: typeof prisma.cashbackRule.findMany } })
      .productDiscountRule;
    if (delegate) {
      const rules = await delegate.findMany({
        where: { clientId, isActive: true },
        select,
      });
      if (rules.length > 0) return rules as ProductDiscountRuleRow[];
    }
  } catch (e) {
    console.warn("productDiscountRule query failed, using cashback fallback:", e);
  }

  // Fallback: same ₹/unit as cashback (admin syncs both; works if Prisma client is stale)
  const cashback = await prisma.cashbackRule.findMany({
    where: { clientId, isActive: true },
    select: {
      productId: true,
      variationId: true,
      type: true,
      valuePaise: true,
      valueBps: true,
    },
  });

  return cashback.map((r) => ({
    productId: r.productId,
    variationId: r.variationId,
    type: r.type as DiscountType,
    valuePaise: r.valuePaise,
    valueBps: r.valueBps,
  }));
}
