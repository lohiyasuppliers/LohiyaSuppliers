"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { CartPriceSync } from "@/components/cart/CartPriceSync";
import {
  CheckoutEarnPreview,
  useCheckoutQuote,
  type B2bRewardChoice,
} from "@/components/checkout/CheckoutRewardsPanel";
import { CheckoutBillOptions } from "@/components/checkout/CheckoutBillOptions";
import { PaymentScannerModal } from "@/components/account/PaymentScannerModal";
import { formatPaise } from "@/lib/utils";
import { DEFAULT_GST_RATE_PERCENT } from "@/lib/constants";
import { CheckCircle, QrCode, ScanLine } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { items, subtotalPaise, clearCart } = useCart();
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [payLaterLoading, setPayLaterLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paidAtCheckout, setPaidAtCheckout] = useState(0);
  const [rewardChoice, setRewardChoice] = useState<B2bRewardChoice>("none");
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const [notes, setNotes] = useState("");

  const applyDiscount = rewardChoice === "discount";
  const applyCashback = rewardChoice === "cashback";

  const checkoutItems = useMemo(
    () =>
      items.map((i) => ({
        productId: i.productId,
        variationId: i.variationId,
        quantity: i.quantity,
      })),
    [items]
  );

  const grossFallback = useMemo(() => {
    const tax = items.reduce(
      (sum, i) => sum + Math.round((i.pricePaise * i.quantity * i.gstRateBps) / 10000),
      0
    );
    return subtotalPaise + tax;
  }, [items, subtotalPaise]);

  const { quote: activeQuote, loading: quoteLoading, error: quoteError } = useCheckoutQuote(
    checkoutItems,
    rewardChoice,
    useWalletBalance
  );

  const payableTotal = activeQuote?.payableTotalPaise ?? grossFallback;
  const taxPaise =
    activeQuote?.taxPaise ??
    items.reduce(
      (sum, i) => sum + Math.round((i.pricePaise * i.quantity * i.gstRateBps) / 10000),
      0
    );
  const lineDisplay = useMemo(() => {
    if (activeQuote?.orderItems?.length) {
      return activeQuote.orderItems.map((line) => ({
        key: `${line.productId}:${line.variationId ?? ""}`,
        label: line.variationLabel
          ? `${line.productName} (${line.variationLabel})`
          : line.productName,
        quantity: line.quantity,
        lineTotal: line.totalPaise,
      }));
    }
    return items.map((item) => ({
      key: item.cartKey,
      label: item.variationLabel ? `${item.name} (${item.variationLabel})` : item.name,
      quantity: item.quantity,
      lineTotal: item.pricePaise * item.quantity,
    }));
  }, [activeQuote?.orderItems, items]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      router.push("/cart");
    }
  }, [items.length, orderPlaced, router]);

  if (status === "loading" || (items.length === 0 && !orderPlaced)) {
    return null;
  }

  function handleCheckoutSuccess(result: {
    orderNumber: string;
    paidPaise: number;
    paymentStatus: string;
  }) {
    setOrderNumber(result.orderNumber);
    setPaidAtCheckout(result.paidPaise);
    clearCart();
    setOrderPlaced(true);
    setScannerOpen(false);
  }

  async function placeOrderPayLater() {
    if (applyDiscount) {
      alert("Discount orders must be paid now.");
      return;
    }
    setPayLaterLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: checkoutItems,
          notes,
          paidPaise: 0,
          useCashback: applyCashback,
          useDiscount: applyDiscount,
          useWalletBalance,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        handleCheckoutSuccess({
          orderNumber: data.orderNumber,
          paidPaise: 0,
          paymentStatus: data.paymentStatus,
        });
      } else {
        alert(data.error || "Failed to place order");
      }
    } catch {
      alert("Failed to place order. Please try again.");
    } finally {
      setPayLaterLoading(false);
    }
  }

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed</h1>
        <p className="text-gray-600 mb-2">
          Order Number: <strong>{orderNumber}</strong>
        </p>
        {paidAtCheckout > 0 ? (
          <p className="text-gray-500 text-sm mb-6">
            {formatPaise(paidAtCheckout)} submitted for admin verification.
          </p>
        ) : (
          <p className="text-gray-500 text-sm mb-6">
            Admin will approve your order. Pay the balance from My Orders when ready.
          </p>
        )}
        <Link
          href="/account/orders"
          className="px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700"
        >
          View Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">B2B Checkout</h1>
      <p className="text-gray-500 text-sm mb-6">
        Ordering as <strong>{session?.user?.email}</strong> — select your B2B savings option
        below, then pay.
      </p>

      <CartPriceSync />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 stagger-children">
        <div className="lg:col-span-2 space-y-6">
          {/* B2B choice FIRST — always visible */}
          <CheckoutBillOptions
            quote={activeQuote}
            loading={quoteLoading}
            error={quoteError}
            choice={rewardChoice}
            onChoiceChange={setRewardChoice}
            useWalletBalance={useWalletBalance}
            onWalletBalanceChange={setUseWalletBalance}
            grossFallback={grossFallback}
          />

          <CheckoutEarnPreview
            quote={activeQuote}
            loading={quoteLoading}
            choice={rewardChoice}
          />

          <div className="relative overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-violet-50 p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-1">Pay with UPI Scanner</h2>
            <p className="text-sm text-gray-600 mb-5">
              {applyDiscount
                ? "Discount applied — complete payment now to place order."
                : applyCashback
                  ? "Earn locked cashback — pay now or use pay later below."
                  : "Scan and pay, or use pay later from the order summary."}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-36 h-36 shrink-0 rounded-2xl border-2 border-dashed border-brand-300 bg-white flex items-center justify-center">
                <QrCode className="w-16 h-16 text-brand-400" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-3xl font-black text-brand-900">
                  {quoteLoading && !activeQuote ? "…" : formatPaise(payableTotal)}
                </p>
                {activeQuote &&
                  (activeQuote.discountPaise > 0 || activeQuote.walletAppliedPaise > 0) && (
                    <p className="text-sm text-gray-400 line-through">
                      {formatPaise(activeQuote.grossTotalPaise)} before savings
                    </p>
                  )}
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-violet-600 text-white font-bold rounded-xl"
                >
                  <ScanLine className="w-5 h-5" />
                  Open Scanner & Pay {formatPaise(payableTotal)}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold text-lg mb-4">Order Notes (optional)</h2>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="PO number, delivery instructions, etc."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 h-fit sticky top-24">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          {lineDisplay.map((line) => (
            <div
              key={line.key}
              className="flex justify-between text-sm py-2 border-b border-gray-50"
            >
              <span className="text-gray-600">
                {line.label} × {line.quantity}
              </span>
              <span>{formatPaise(line.lineTotal)}</span>
            </div>
          ))}
          <div className="space-y-2 mt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatPaise(activeQuote?.subtotalPaise ?? subtotalPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GST @ {DEFAULT_GST_RATE_PERCENT}%</span>
              <span>{formatPaise(taxPaise)}</span>
            </div>
            {activeQuote && activeQuote.discountPaise > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>−{formatPaise(activeQuote.discountPaise)}</span>
              </div>
            )}
            {activeQuote && activeQuote.walletAppliedPaise > 0 && (
              <div className="flex justify-between text-violet-700">
                <span>Wallet balance</span>
                <span>−{formatPaise(activeQuote.walletAppliedPaise)}</span>
              </div>
            )}
            {applyCashback && activeQuote && activeQuote.cashbackToLockPaise > 0 && (
              <div className="flex justify-between text-amber-700 text-sm">
                <span>Cashback (locked after order)</span>
                <span>+{formatPaise(activeQuote.cashbackToLockPaise)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Amount due</span>
              <span>{formatPaise(payableTotal)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="mt-6 w-full py-3 bg-gradient-to-r from-brand-600 to-violet-600 text-white rounded-xl font-semibold"
          >
            Scan & Pay — {formatPaise(payableTotal)}
          </button>

          {!applyDiscount ? (
            <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2.5 text-center">
              <button
                type="button"
                onClick={placeOrderPayLater}
                disabled={payLaterLoading}
                className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50"
              >
                {payLaterLoading
                  ? "Placing order…"
                  : applyCashback
                    ? "Pay later — cashback unlocks after full payment"
                    : "Pay later — full amount due when you pay"}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-center text-emerald-700 font-medium">
              Pay later disabled — discount requires pay now
            </p>
          )}
        </div>
      </div>

      {scannerOpen && (
        <PaymentScannerModal
          orders={[]}
          totalDuePaise={payableTotal}
          maxAmountPaise={payableTotal}
          checkout={{
            items: checkoutItems,
            notes,
            rewardChoice,
            initialRewardChoice: rewardChoice,
            useWalletBalance,
          }}
          onCheckoutSuccess={handleCheckoutSuccess}
          onClose={() => setScannerOpen(false)}
          onPaid={() => {}}
        />
      )}
    </div>
  );
}
