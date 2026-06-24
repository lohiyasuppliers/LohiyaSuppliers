"use client";

import { useEffect, useState, useRef } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { formatPaise } from "@/lib/utils";

export type CheckoutQuoteData = {
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
  requiresPayNow?: boolean;
  orderItems?: Array<{
    productId: string;
    variationId: string | null;
    productName: string;
    variationLabel: string | null;
    quantity: number;
    totalPaise: number;
  }>;
  lineBreakdown?: Array<{
    productName: string;
    variationLabel: string | null;
    quantity: number;
    discountPaise: number;
    cashbackRebatePaise: number;
  }>;
};

export type B2bRewardChoice = "none" | "discount" | "cashback";

export function useCheckoutQuote(
  items: Array<{ productId: string; variationId?: string; quantity: number }>,
  choice: B2bRewardChoice,
  useWalletBalance = false
) {
  const [quote, setQuote] = useState<CheckoutQuoteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsKey = JSON.stringify(items);
  const requestId = useRef(0);

  const useDiscount = choice === "discount";
  const useCashback = choice === "cashback";

  useEffect(() => {
    if (!items.length) {
      setQuote(null);
      setError(null);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify({ items, useDiscount, useCashback, useWalletBalance }),
      })
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || "Failed to load checkout quote");
          return data as CheckoutQuoteData;
        })
        .then((data) => {
          if (requestId.current === id) {
            setQuote(data);
            setError(null);
          }
        })
        .catch((e) => {
          if (requestId.current === id) {
            setError(e instanceof Error ? e.message : "Quote failed");
          }
        })
        .finally(() => {
          if (requestId.current === id) setLoading(false);
        });
    }, 100);

    return () => clearTimeout(timer);
  }, [itemsKey, useDiscount, useCashback, useWalletBalance]);

  return { quote, loading, error };
}

export function CheckoutEarnPreview({
  quote,
  loading,
  choice,
}: {
  quote: CheckoutQuoteData | null;
  loading: boolean;
  choice: B2bRewardChoice;
}) {
  if (loading || !quote) return null;

  if (choice === "cashback" && quote.cashbackToLockPaise > 0) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 text-sm space-y-2">
        <p className="flex items-center gap-2 text-amber-800">
          <Lock className="w-4 h-4" />
          <strong>{formatPaise(quote.cashbackToLockPaise)}</strong> will be added to your wallet
          (locked) after placing this order
        </p>
        <p className="text-xs text-gray-500">
          Unlocks when this order is fully paid — then redeem via UPI, next order, or gift cards
        </p>
      </div>
    );
  }

  if (choice !== "none") return null;
  if (quote.lockedCashbackPaise <= 0) return null;

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 text-sm space-y-2">
      {quote.lockedCashbackPaise > 0 && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          {formatPaise(quote.lockedCashbackPaise)} locked until previous orders are fully paid
        </p>
      )}
    </div>
  );
}
