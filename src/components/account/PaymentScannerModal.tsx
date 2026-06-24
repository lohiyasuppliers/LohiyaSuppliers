"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle,
  Loader2,
  QrCode,
  ScanLine,
  X,
  ImagePlus,
  Shield,
} from "lucide-react";
import { formatPaise, paiseToRupees, rupeesToPaise } from "@/lib/utils";
import { CheckoutBillOptions } from "@/components/checkout/CheckoutBillOptions";
import { useCheckoutQuote, type B2bRewardChoice } from "@/components/checkout/CheckoutRewardsPanel";

export interface PayableOrderInfo {
  id: string;
  orderNumber: string;
  totalPaise: number;
  paidPaise: number;
  balancePaise: number;
  createdAt?: string | Date;
}

export interface CheckoutPayload {
  items: { productId: string; variationId?: string; quantity: number }[];
  notes?: string;
  rewardChoice?: B2bRewardChoice;
  initialRewardChoice?: B2bRewardChoice;
  useWalletBalance?: boolean;
}

interface PaymentScannerModalProps {
  orders: PayableOrderInfo[];
  totalDuePaise: number;
  orderId?: string;
  orderNumber?: string;
  maxAmountPaise?: number;
  priorPaidPaise?: number;
  initialMode?: "full" | "partial";
  checkout?: CheckoutPayload;
  onCheckoutSuccess?: (result: {
    orderNumber: string;
    paidPaise: number;
    paymentStatus: string;
  }) => void;
  onClose: () => void;
  onPaid: () => void;
}

export function PaymentScannerModal(props: PaymentScannerModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<PaymentScannerModalInner {...props} />, document.body);
}

function PaymentScannerModalInner({
  orders,
  totalDuePaise,
  orderId,
  orderNumber,
  maxAmountPaise,
  priorPaidPaise = 0,
  initialMode = "full",
  checkout,
  onCheckoutSuccess,
  onClose,
  onPaid,
}: PaymentScannerModalProps) {
  const [step, setStep] = useState<"scan" | "proof" | "done">("scan");
  const [mode, setMode] = useState<"full" | "partial">(initialMode);
  const [rupeesInput, setRupeesInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [rewardChoice, setRewardChoice] = useState<B2bRewardChoice>(
    checkout?.initialRewardChoice ?? checkout?.rewardChoice ?? "none"
  );
  const [useWalletBalance, setUseWalletBalance] = useState(
    checkout?.useWalletBalance ?? false
  );

  const { quote: checkoutQuote, loading: quoteLoading, error: quoteError } = useCheckoutQuote(
    checkout?.items ?? [],
    rewardChoice,
    useWalletBalance
  );

  const checkoutPayable = checkoutQuote?.payableTotalPaise ?? totalDuePaise;
  const cap = checkout ? checkoutPayable : (maxAmountPaise ?? totalDuePaise);

  const partialPaise = (() => {
    const n = parseFloat(rupeesInput.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return 0;
    return rupeesToPaise(n);
  })();

  const payAmountPaise = mode === "full" ? cap : Math.min(partialPaise, cap);
  const pctOfBalance =
    cap > 0 ? Math.min(100, Math.round((payAmountPaise / cap) * 100)) : 0;
  const hasPriorPayment = priorPaidPaise > 0;

  const contextLabel = checkout
    ? "Checkout"
    : orderNumber
      ? orderNumber
      : `${orders.length} orders`;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (mode === "partial" && !rupeesInput) {
      setRupeesInput(String(Math.round(paiseToRupees(cap) * 0.5)));
    }
  }, [mode, cap, rupeesInput]);

  async function handleScan() {
    if (payAmountPaise < 100) {
      setError("Minimum payment is ₹1");
      return;
    }
    setScanning(true);
    setError("");
    await new Promise((r) => setTimeout(r, 1500));
    setScanning(false);
    setStep("proof");
  }

  function handleScreenshotFile(file: File | null) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image (PNG or JPG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submitWithProof() {
    if (!screenshot) {
      setError("Upload a payment screenshot");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const proofBody = { screenshot };

      let res: Response;
      if (checkout) {
        res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: checkout.items,
            notes: checkout.notes,
            paidPaise: payAmountPaise,
            useDiscount: rewardChoice === "discount",
            useCashback: rewardChoice === "cashback",
            useWalletBalance,
            proof: proofBody,
          }),
        });
      } else if (orderId) {
        res = await fetch(`/api/user/orders/${orderId}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountPaise: mode === "full" ? undefined : payAmountPaise,
            proof: proofBody,
          }),
        });
      } else {
        res = await fetch("/api/user/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountPaise: payAmountPaise, proof: proofBody }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      if (checkout && onCheckoutSuccess) {
        onCheckoutSuccess({
          orderNumber: data.orderNumber,
          paidPaise: payAmountPaise,
          paymentStatus: data.paymentStatus ?? "PENDING_VERIFICATION",
        });
      }
      setStep("done");
      onPaid();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    step === "proof"
      ? "Upload payment proof"
      : step === "done"
        ? "Payment submitted"
        : "UPI Payment";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="w-full max-w-[460px] flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200/80 overflow-hidden"
        style={{ maxHeight: "calc(100dvh - 2rem)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        {/* Brand header */}
        <div className="shrink-0 bg-brand-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-brand-300 text-xs font-medium">
                <Shield className="w-3.5 h-3.5" />
                Secure UPI · Lohiya Suppliers
              </div>
              <h2
                id="payment-modal-title"
                className="text-lg font-semibold text-white mt-1.5 tracking-tight"
              >
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {step === "scan" && (
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-brand-300 uppercase tracking-wide">
                  Order
                </p>
                <p className="text-sm font-semibold text-white truncate mt-0.5">
                  {contextLabel}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-medium text-brand-300 uppercase tracking-wide">
                  {hasPriorPayment ? "Remaining due" : "Balance due"}
                </p>
                <p className="text-lg font-bold text-white tabular-nums mt-0.5">
                  {formatPaise(cap)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5">
          {step === "done" ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-100">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-base font-semibold text-gray-900">Awaiting admin verification</p>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-xs mx-auto">
                <span className="font-semibold text-gray-900">{formatPaise(payAmountPaise)}</span>{" "}
                submitted. Your balance updates once admin confirms.
              </p>
            </div>
          ) : step === "proof" ? (
            <div className="space-y-4">
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">Payment amount</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums mt-0.5">
                  {formatPaise(payAmountPaise)}
                </p>
              </div>
              <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-8 hover:border-brand-400 hover:bg-brand-50/40 transition-colors">
                {screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={screenshot}
                    alt="Payment screenshot"
                    className="max-h-36 w-full object-contain rounded-lg"
                  />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-3">
                      <ImagePlus className="w-6 h-6 text-brand-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-800">Upload payment screenshot</p>
                    <p className="text-xs text-gray-500 mt-1">PNG or JPG · maximum 2 MB</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleScreenshotFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-5">
              {checkout && (
                <CheckoutBillOptions
                  quote={checkoutQuote}
                  loading={quoteLoading}
                  error={quoteError}
                  choice={rewardChoice}
                  onChoiceChange={setRewardChoice}
                  useWalletBalance={useWalletBalance}
                  onWalletBalanceChange={setUseWalletBalance}
                  grossFallback={totalDuePaise}
                  compact
                />
              )}

              {/* Payment mode — professional segmented control */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
                  Payment type
                </p>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMode("full")}
                    className={`rounded-lg py-2.5 px-3 text-center transition-all ${
                      mode === "full"
                        ? "bg-white text-brand-900 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {hasPriorPayment ? "Pay Remaining" : "Pay Now"}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {hasPriorPayment ? "Full remaining balance" : "Full amount"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("partial")}
                    className={`rounded-lg py-2.5 px-3 text-center transition-all ${
                      mode === "partial"
                        ? "bg-white text-brand-900 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <span className="block text-sm font-semibold">Pay Partial</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Custom amount</span>
                  </button>
                </div>
              </div>

              {mode === "partial" && (
                <div className="space-y-3">
                  <label
                    htmlFor="partial-amount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Enter amount
                    <span className="text-gray-400 font-normal"> (max {formatPaise(cap)})</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-gray-400">
                      ₹
                    </span>
                    <input
                      id="partial-amount"
                      type="text"
                      inputMode="decimal"
                      value={rupeesInput}
                      onChange={(e) =>
                        setRupeesInput(e.target.value.replace(/[^\d.]/g, ""))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-lg font-semibold text-gray-900 tabular-nums placeholder:text-gray-300 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{pctOfBalance}% of outstanding balance</span>
                    <span className="font-semibold text-gray-700">{formatPaise(payAmountPaise)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all duration-300"
                      style={{ width: `${pctOfBalance}%` }}
                    />
                  </div>
                </div>
              )}

              {/* QR scan area */}
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-6 py-6 text-center">
                <div className="relative inline-flex mb-4">
                  <QrCode
                    className={`h-16 w-16 text-brand-700 ${scanning ? "opacity-20" : ""}`}
                  />
                  {scanning && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-600 animate-[scan_1.2s_ease-in-out_infinite]" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount to pay
                </p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums tracking-tight mt-1">
                  {formatPaise(payAmountPaise)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {mode === "full" ? "Full payment" : "Partial payment"} via UPI scanner
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 text-center">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 bg-gray-50/80 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {step === "done" ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Close
            </button>
          ) : step === "proof" ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("scan")}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={submitWithProof}
                disabled={submitting || !screenshot}
                className="flex-[1.2] rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit for verification"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning || payAmountPaise < 100 || (checkout && quoteLoading)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning QR code…
                </>
              ) : (
                <>
                  <ScanLine className="h-4 w-4" />
                  Scan & Pay {formatPaise(payAmountPaise)}
                </>
              )}
            </button>
          )}
          <p className="mt-3 text-center text-xs text-gray-500 leading-relaxed">
            Payment is verified by admin before your balance is updated.
          </p>
        </div>
      </div>
    </div>
  );
}
