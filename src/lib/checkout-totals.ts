import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { resolvePricesForLineItems, unitPriceFromMap } from "./pricing";
import {
  computeOrderDiscountFromLines,
  discountPaiseForLine,
  getClientProductDiscountRules,
} from "./discount-rules";
import { createOrderCashbackEntry, getWalletBalances } from "./cashback-wallet";
import {
  cashbackPaiseForLine,
  computeOrderCashbackRebate,
  type CashbackRuleRow,
} from "./cashback-rules";

export interface CheckoutLineInput {
  productId: string;
  variationId?: string;
  quantity: number;
}

export interface CheckoutQuoteLineBreakdown {
  productId: string;
  variationId: string | null;
  productName: string;
  variationLabel: string | null;
  quantity: number;
  lineTotalPaise: number;
  discountPaise: number;
  cashbackRebatePaise: number;
}

export interface CheckoutQuote {
  subtotalPaise: number;
  taxPaise: number;
  grossTotalPaise: number;
  discountPaise: number;
  potentialDiscountPaise: number;
  discountTitle: string | null;
  cashbackAppliedPaise: number;
  potentialCashbackPaise: number;
  walletAppliedPaise: number;
  payableTotalPaise: number;
  cashbackToEarnPaise: number;
  cashbackToLockPaise: number;
  availableCashbackPaise: number;
  lockedCashbackPaise: number;
  requiresPayNow: boolean;
  lineBreakdown: CheckoutQuoteLineBreakdown[];
  orderItems: Array<{
    productId: string;
    variationId: string | null;
    productName: string;
    variationLabel: string | null;
    hsnCode: string;
    gstRateBps: number;
    quantity: number;
    unitPricePaise: number;
    totalPaise: number;
  }>;
}

export async function buildCheckoutQuote(
  clientId: string,
  items: CheckoutLineInput[],
  options?: {
    useDiscount?: boolean;
    useCashback?: boolean;
    applyCashbackPaise?: number;
    useWalletBalance?: boolean;
  }
): Promise<CheckoutQuote> {
  if (options?.useDiscount && options?.useCashback) {
    throw new Error("Choose discount or cashback — not both");
  }

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { variations: { where: { isActive: true } } },
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
  const orderItems: CheckoutQuote["orderItems"] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product unavailable`);

    const variation = item.variationId
      ? product.variations.find((v) => v.id === item.variationId)
      : undefined;

    if (item.variationId && !variation) {
      throw new Error(`Variation not found for ${product.name}`);
    }

    const fallback = variation?.defaultPricePaise ?? product.defaultPricePaise;
    const unitPricePaise = unitPriceFromMap(
      priceMap,
      product.id,
      item.variationId,
      fallback
    );

    const lineTotal = unitPricePaise * item.quantity;
    const lineTax = Math.round((lineTotal * product.gstRateBps) / 10000);
    subtotalPaise += lineTotal;
    taxPaise += lineTax;

    const attrs = variation?.attributes as Record<string, string> | undefined;
    orderItems.push({
      productId: product.id,
      variationId: variation?.id ?? null,
      productName: product.name,
      variationLabel: attrs ? Object.values(attrs).join(" · ") : null,
      hsnCode: product.hsnCode,
      gstRateBps: product.gstRateBps,
      quantity: item.quantity,
      unitPricePaise,
      totalPaise: lineTotal,
    });
  }

  const grossTotalPaise = subtotalPaise + taxPaise;

  const [discountRules, wallet, cashbackRules] = await Promise.all([
    getClientProductDiscountRules(clientId),
    getWalletBalances(clientId),
    prisma.cashbackRule.findMany({
      where: { clientId, isActive: true },
      select: {
        productId: true,
        variationId: true,
        type: true,
        valuePaise: true,
        valueBps: true,
      },
    }),
  ]);

  const rules = cashbackRules as CashbackRuleRow[];

  const { totalDiscountPaise: potentialDiscountPaise } = computeOrderDiscountFromLines(
    orderItems,
    discountRules
  );

  const potentialCashbackPaise = computeOrderCashbackRebate(orderItems, rules);

  const discountPaise = options?.useDiscount ? potentialDiscountPaise : 0;
  const afterDiscount = Math.max(0, grossTotalPaise - discountPaise);

  // Cashback choice credits locked wallet — never deducted from bill
  const cashbackAppliedPaise = 0;
  const cashbackToLockPaise = options?.useCashback ? potentialCashbackPaise : 0;

  const afterRebates = afterDiscount;
  const walletAppliedPaise = options?.useWalletBalance
    ? Math.min(wallet.availablePaise, afterRebates)
    : 0;

  const payableTotalPaise = afterRebates - walletAppliedPaise;

  const lineBreakdown: CheckoutQuoteLineBreakdown[] = orderItems.map((item) => ({
    productId: item.productId,
    variationId: item.variationId,
    productName: item.productName,
    variationLabel: item.variationLabel,
    quantity: item.quantity,
    lineTotalPaise: item.totalPaise,
    discountPaise: discountPaiseForLine(
      discountRules,
      item.productId,
      item.variationId,
      item.totalPaise,
      item.quantity
    ),
    cashbackRebatePaise: cashbackPaiseForLine(
      rules,
      item.productId,
      item.variationId,
      item.totalPaise,
      item.quantity
    ),
  }));

  // Cashback only when user selects product cashback — locked until order fully paid
  const cashbackToEarnPaise = cashbackToLockPaise;

  return {
    subtotalPaise,
    taxPaise,
    grossTotalPaise,
    discountPaise,
    potentialDiscountPaise,
    discountTitle:
      potentialDiscountPaise > 0 ? "Product & variant discounts" : null,
    cashbackAppliedPaise,
    potentialCashbackPaise,
    walletAppliedPaise,
    payableTotalPaise,
    cashbackToEarnPaise,
    cashbackToLockPaise,
    availableCashbackPaise: wallet.availablePaise,
    lockedCashbackPaise: wallet.lockedPaise,
    requiresPayNow: !!options?.useDiscount,
    lineBreakdown,
    orderItems,
  };
}

/** After order is created — credit locked cashback when product cashback is selected. */
export async function creditOrderCashbackIfEligible(
  clientId: string,
  orderId: string,
  cashbackToEarnPaise: number,
  _paidFullAtCheckout: boolean,
  usedDiscount: boolean,
  usedCashbackChoice: boolean,
  db: Prisma.TransactionClient
) {
  if (usedDiscount || !usedCashbackChoice || cashbackToEarnPaise <= 0) return;
  await createOrderCashbackEntry(clientId, orderId, cashbackToEarnPaise, false, db);
}
