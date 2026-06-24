import { CashbackType } from "@prisma/client";
import { prisma } from "./prisma";
import { PRODUCT_LEVEL_VARIATION_ID } from "./constants";

export type CashbackRuleRow = {
  productId: string;
  variationId: string;
  type: CashbackType;
  valuePaise: number | null;
  valueBps: number | null;
};

/** Resolve fixed/percentage cashback (paise) for one line item. */
export function cashbackPaiseForLine(
  rules: CashbackRuleRow[],
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

  if (rule.type === CashbackType.FIXED && rule.valuePaise != null) {
    return Math.max(0, rule.valuePaise * quantity);
  }

  if (rule.type === CashbackType.PERCENTAGE && rule.valueBps != null) {
    return Math.max(0, Math.round((lineTotalPaise * rule.valueBps) / 10000));
  }

  return 0;
}

export function computeOrderCashbackRebate(
  items: Array<{
    productId: string;
    variationId: string | null;
    totalPaise: number;
    quantity: number;
  }>,
  rules: CashbackRuleRow[]
): number {
  let total = 0;
  for (const item of items) {
    total += cashbackPaiseForLine(
      rules,
      item.productId,
      item.variationId,
      item.totalPaise,
      item.quantity
    );
  }
  return total;
}

/** Credit earned cashback when an order becomes fully paid (idempotent). */
export async function creditCashbackForOrder(orderId: string) {
  const { unlockCashbackForOrder } = await import("./cashback-wallet");
  await unlockCashbackForOrder(orderId);
}
