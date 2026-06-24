"use client";

import { formatPaise } from "@/lib/utils";
import { Gift, Tag, AlertCircle, Circle, CheckCircle2, Wallet } from "lucide-react";
import type { B2bRewardChoice, CheckoutQuoteData } from "./CheckoutRewardsPanel";

export function CheckoutBillOptions({
  quote,
  loading,
  error,
  choice,
  onChoiceChange,
  useWalletBalance,
  onWalletBalanceChange,
  grossFallback,
  compact = false,
}: {
  quote: CheckoutQuoteData | null;
  loading: boolean;
  error: string | null;
  choice: B2bRewardChoice;
  onChoiceChange: (c: B2bRewardChoice) => void;
  useWalletBalance?: boolean;
  onWalletBalanceChange?: (use: boolean) => void;
  grossFallback?: number;
  compact?: boolean;
}) {
  const hasDiscount = (quote?.potentialDiscountPaise ?? 0) > 0;
  const hasCashback = (quote?.potentialCashbackPaise ?? 0) > 0;
  const walletAvailable = quote?.availableCashbackPaise ?? 0;
  const hasWallet = walletAvailable > 0;
  const gross = quote?.grossTotalPaise ?? grossFallback ?? 0;
  const payable = quote?.payableTotalPaise ?? grossFallback ?? gross;
  const walletApplied = quote?.walletAppliedPaise ?? 0;

  const options: Array<{
    id: B2bRewardChoice;
    label: string;
    sub: string;
    amount?: number;
    amountPrefix?: string;
    icon: typeof Tag;
    color: string;
    disabled?: boolean;
    disabledReason?: string;
  }> = [
    {
      id: "none",
      label: "No discount / cashback",
      sub: "Pay full bill · pay now or pay later",
      icon: Circle,
      color: "gray",
    },
    {
      id: "discount",
      label: "Use product discount",
      sub: hasDiscount
        ? `−${formatPaise(quote!.potentialDiscountPaise)} off · pay now only`
        : "Not configured for items in cart",
      amount: quote?.potentialDiscountPaise,
      icon: Tag,
      color: "emerald",
      disabled: !hasDiscount && !loading,
      disabledReason: "Admin has not set discount for these products",
    },
    {
      id: "cashback",
      label: "Earn product cashback",
      sub: hasCashback
        ? `${formatPaise(quote!.potentialCashbackPaise)} to locked wallet · unlocks after full payment`
        : "Not configured for items in cart",
      amount: quote?.potentialCashbackPaise,
      amountPrefix: "+",
      icon: Gift,
      color: "amber",
      disabled: !hasCashback && !loading,
      disabledReason: "Admin has not set cashback for these products",
    },
  ];

  return (
    <div
      className={`rounded-2xl border-2 border-brand-200 bg-white shadow-sm ${
        compact ? "p-3 text-xs" : "p-5 text-sm"
      }`}
    >
      <div className="mb-4">
        <h2 className="font-bold text-gray-900 text-base">B2B savings — choose one</h2>
        <p className="text-xs text-gray-500 mt-1">
          Discount and cashback cannot be used together. Amounts are per product/variant set by
          admin (e.g. ₹10/unit × quantity).
        </p>
      </div>

      {error && (
        <p className="mb-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}. Refresh the page or contact support.
        </p>
      )}

      <div className="space-y-2">
        {options.map((opt) => {
          const selected = choice === opt.id;
          const Icon = opt.icon;
          const isDisabled = opt.disabled && opt.id !== "none";

          return (
            <button
              key={opt.id}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onChoiceChange(opt.id)}
              className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                isDisabled
                  ? "opacity-45 cursor-not-allowed border-gray-100 bg-gray-50"
                  : selected
                    ? opt.color === "emerald"
                      ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200"
                      : opt.color === "amber"
                        ? "border-amber-400 bg-amber-50 ring-1 ring-amber-200"
                        : "border-brand-400 bg-brand-50 ring-1 ring-brand-200"
                    : "border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50/80"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 font-semibold text-gray-900">
                  <Icon
                    className={`w-4 h-4 ${
                      opt.color === "emerald"
                        ? "text-emerald-600"
                        : opt.color === "amber"
                          ? "text-amber-600"
                          : "text-gray-400"
                    }`}
                  />
                  {opt.label}
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">{opt.sub}</span>
                {isDisabled && opt.disabledReason && (
                  <span className="block text-xs text-gray-400 mt-1">{opt.disabledReason}</span>
                )}
              </span>
              {opt.amount != null && opt.amount > 0 && (
                <span
                  className={`shrink-0 font-bold text-sm ${
                    opt.color === "emerald"
                      ? "text-emerald-700"
                      : opt.color === "amber"
                        ? "text-amber-700"
                        : "text-gray-600"
                  }`}
                >
                  {opt.amountPrefix ?? "−"}
                  {formatPaise(opt.amount)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {hasWallet && onWalletBalanceChange && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => onWalletBalanceChange(!useWalletBalance)}
            className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
              useWalletBalance
                ? "border-violet-400 bg-violet-50 ring-1 ring-violet-200"
                : "border-gray-200 bg-white hover:border-violet-300 hover:bg-gray-50/80"
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                useWalletBalance
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-gray-300 bg-white"
              }`}
            >
              {useWalletBalance && <CheckCircle2 className="w-3.5 h-3.5" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2 font-semibold text-gray-900">
                <Wallet className="w-4 h-4 text-violet-600" />
                Use wallet balance
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                {formatPaise(walletAvailable)} unlocked · applies on top of any savings above
              </span>
            </span>
            {useWalletBalance && walletApplied > 0 && (
              <span className="shrink-0 font-bold text-sm text-violet-700">
                −{formatPaise(walletApplied)}
              </span>
            )}
          </button>
          {(quote?.lockedCashbackPaise ?? 0) > 0 && (
            <p className="mt-2 text-xs text-gray-400 px-1">
              {formatPaise(quote!.lockedCashbackPaise)} still locked until previous orders are paid
            </p>
          )}
        </div>
      )}

      {choice === "discount" && (
        <p className="mt-3 flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Discount selected — you must <strong>pay now</strong>. Pay later is disabled.
        </p>
      )}

      {choice === "cashback" && (
        <p className="mt-3 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Pay the full bill now or later. Cashback is credited to your wallet (locked) and unlocks
          once this order is fully paid — use it for UPI, future orders, or gift cards.
        </p>
      )}

      {quote?.lineBreakdown?.some(
        (l) => l.discountPaise > 0 || l.cashbackRebatePaise > 0
      ) && (
        <div className="mt-4 rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-1.5 text-xs">
          <p className="font-semibold text-gray-700">Per line (admin rules)</p>
          {quote.lineBreakdown.map((line, i) => {
            if (line.discountPaise <= 0 && line.cashbackRebatePaise <= 0) return null;
            const label = line.variationLabel
              ? `${line.productName} (${line.variationLabel})`
              : line.productName;
            return (
              <div key={i} className="flex justify-between gap-2 text-gray-600">
                <span>
                  {label} × {line.quantity}
                </span>
                <span>
                  {line.discountPaise > 0 && (
                    <span className="text-emerald-700 mr-2">disc −{formatPaise(line.discountPaise)}</span>
                  )}
                  {line.cashbackRebatePaise > 0 && (
                    <span className="text-amber-700">cb +{formatPaise(line.cashbackRebatePaise)}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
        {loading && !quote ? (
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <>
            <div className="flex justify-between text-gray-500">
              <span>Bill total (incl. GST)</span>
              <span>{formatPaise(gross)}</span>
            </div>
            {(quote?.discountPaise ?? 0) > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount</span>
                <span>−{formatPaise(quote!.discountPaise)}</span>
              </div>
            )}
            {(quote?.walletAppliedPaise ?? 0) > 0 && (
              <div className="flex justify-between text-violet-700 font-medium">
                <span>Wallet balance</span>
                <span>−{formatPaise(quote!.walletAppliedPaise)}</span>
              </div>
            )}
            {choice === "cashback" && (quote?.cashbackToLockPaise ?? 0) > 0 && (
              <div className="flex justify-between text-amber-700 text-sm">
                <span>Cashback (locked after order)</span>
                <span>+{formatPaise(quote!.cashbackToLockPaise)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-gray-900 pt-1">
              <span>You pay</span>
              <span className="text-brand-700">{formatPaise(payable)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
