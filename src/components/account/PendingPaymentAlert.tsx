"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IndianRupee,
  X,
  Zap,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { formatPaise, formatDate, daysPendingSince } from "@/lib/utils";
import { PaymentScannerModal, type PayableOrderInfo } from "@/components/account/PaymentScannerModal";

const POPUP_KEY = "lohiya-payment-popup-seen";

export interface PaymentSummary {
  orders: PayableOrderInfo[];
  totalDuePaise: number;
  totalOrderValuePaise: number;
  totalPaidPaise: number;
  orderCount: number;
  verificationOrders?: {
    id: string;
    orderNumber: string;
    pendingPaymentPaise: number;
    createdAt: Date;
  }[];
}

function OrderPayRow({
  order,
  allOrders,
  totalDuePaise,
}: {
  order: PayableOrderInfo;
  allOrders: PayableOrderInfo[];
  totalDuePaise: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<"full" | "partial">("full");
  const days = order.createdAt ? daysPendingSince(order.createdAt) : 0;
  const hasPriorPayment = order.paidPaise > 0;

  function openPay(mode: "full" | "partial") {
    setInitialMode(mode);
    setOpen(true);
  }

  return (
    <>
      <div className="rounded-2xl bg-white/15 backdrop-blur border border-white/20 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-lg md:text-xl">{order.orderNumber}</p>
            <p className="text-amber-100 text-sm mt-1">
              Order date: {order.createdAt ? formatDate(order.createdAt) : "—"}
            </p>
            <p className="text-amber-200/90 text-sm">
              {days} day{days !== 1 ? "s" : ""} pending
            </p>
            <p className="text-2xl md:text-3xl font-black mt-3">{formatPaise(order.balancePaise)}</p>
            <p className="text-xs text-amber-200/80 mt-1">
              {hasPriorPayment ? "remaining balance" : "balance due"}
            </p>
            {order.paidPaise > 0 && (
              <p className="text-xs text-emerald-200 mt-1">
                {formatPaise(order.paidPaise)} already approved · bill {formatPaise(order.totalPaise)}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => openPay("full")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-orange-700 font-bold rounded-xl hover:bg-amber-50 shadow-lg text-sm"
            >
              <IndianRupee className="w-4 h-4" />
              {hasPriorPayment ? "Pay Remaining" : "Pay Now"}
            </button>
            <button
              type="button"
              onClick={() => openPay("partial")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 border border-white/30 text-sm"
            >
              {hasPriorPayment ? "Pay Less" : "Pay Partial"}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <PaymentScannerModal
          orders={allOrders}
          totalDuePaise={totalDuePaise}
          orderId={order.id}
          orderNumber={order.orderNumber}
          maxAmountPaise={order.balancePaise}
          priorPaidPaise={order.paidPaise}
          initialMode={initialMode}
          onClose={() => setOpen(false)}
          onPaid={() => router.refresh()}
        />
      )}
    </>
  );
}

/** Sticky top bar */
export function PendingPaymentAlert({ summary }: { summary: PaymentSummary }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  if (dismissed || summary.totalDuePaise <= 0) return null;

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-amber-300/50 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <Zap className="w-4 h-4" />
          </div>
          <p className="flex-1 text-sm font-semibold min-w-0">
            <span className="font-black text-lg">{formatPaise(summary.totalDuePaise)}</span> pending
            · {summary.orderCount} order{summary.orderCount !== 1 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={() => setPayOpen(true)}
            className="px-4 py-1.5 bg-white text-orange-700 text-sm font-bold rounded-xl hover:bg-orange-50"
          >
            Pay Now
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-white/10 rounded-lg"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {payOpen && (
        <PaymentScannerModal
          orders={summary.orders}
          totalDuePaise={summary.totalDuePaise}
          onClose={() => setPayOpen(false)}
          onPaid={() => router.refresh()}
        />
      )}
    </>
  );
}

/** Auto popup on first visit when balance due */
export function PendingPaymentPopup({ summary }: { summary: PaymentSummary }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    if (summary.totalDuePaise <= 0) return;
    const seen = sessionStorage.getItem(POPUP_KEY);
    if (!seen) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [summary.totalDuePaise]);

  function dismiss() {
    sessionStorage.setItem(POPUP_KEY, "1");
    setVisible(false);
  }

  if (!visible || summary.totalDuePaise <= 0) return null;

  return (
    <>
      <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950 to-violet-950 text-white shadow-2xl animate-fade-in-up border border-white/10">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/30 rounded-full blur-3xl" />
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative p-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Payment Due
            </div>
            <p className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200">
              {formatPaise(summary.totalDuePaise)}
            </p>
            <p className="text-brand-200 text-sm mt-2">
              Across {summary.orderCount} approved order{summary.orderCount !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  dismiss();
                  setPayOpen(true);
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold rounded-2xl hover:from-amber-300 hover:to-orange-400 shadow-lg shadow-amber-500/30"
              >
                Pay Now
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="flex-1 py-3.5 bg-white/10 border border-white/20 font-semibold rounded-2xl hover:bg-white/15"
              >
                Later
              </button>
            </div>
            <p className="text-xs text-brand-300/80 mt-4">
              Pay full amount or a partial amount — balance stays on your account
            </p>
          </div>
        </div>
      </div>
      {payOpen && (
        <PaymentScannerModal
          orders={summary.orders}
          totalDuePaise={summary.totalDuePaise}
          onClose={() => setPayOpen(false)}
          onPaid={() => {
            router.refresh();
            dismiss();
          }}
        />
      )}
    </>
  );
}

/** Big dashboard hero block */
export function PendingPaymentHero({ summary }: { summary: PaymentSummary }) {
  const router = useRouter();
  const [payAllOpen, setPayAllOpen] = useState(false);
  const [payAllMode, setPayAllMode] = useState<"full" | "partial">("full");

  if (summary.totalDuePaise <= 0 && !summary.verificationOrders?.length) return null;

  function openPayAll(mode: "full" | "partial") {
    setPayAllMode(mode);
    setPayAllOpen(true);
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 shadow-2xl shadow-amber-500/10 animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700" />
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-yellow-300 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative p-6 md:p-8 text-white">
          {summary.totalDuePaise > 0 && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-amber-100 text-xs font-bold uppercase tracking-widest mb-3">
                    <TrendingDown className="w-3.5 h-3.5" /> Outstanding Balance
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                    {formatPaise(summary.totalDuePaise)}
                  </h2>
                  <p className="text-amber-100/90 text-sm mt-2">
                    {summary.orderCount} order{summary.orderCount !== 1 ? "s" : ""} awaiting payment
                    {summary.totalPaidPaise > 0 && (
                      <> · {formatPaise(summary.totalPaidPaise)} already settled</>
                    )}
                  </p>
                </div>
                {summary.orderCount >= 1 && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openPayAll("full")}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-white text-orange-700 font-bold rounded-2xl hover:bg-amber-50 shadow-xl text-sm"
                    >
                      <IndianRupee className="w-4 h-4" />
                      {summary.totalPaidPaise > 0 ? "Pay All Remaining" : "Pay Now"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openPayAll("partial")}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-white/20 text-white font-semibold rounded-2xl hover:bg-white/30 border border-white/30 text-sm"
                    >
                      Pay Partial
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {summary.orders.map((o) => (
                  <OrderPayRow
                    key={o.id}
                    order={o}
                    allOrders={summary.orders}
                    totalDuePaise={summary.totalDuePaise}
                  />
                ))}
              </div>
            </>
          )}

          {summary.verificationOrders && summary.verificationOrders.length > 0 && (
            <div className={summary.totalDuePaise > 0 ? "mt-6 pt-6 border-t border-white/20" : ""}>
              <p className="text-sm font-semibold text-amber-100 mb-3 uppercase tracking-wide">
                Awaiting admin verification
              </p>
              <div className="space-y-2">
                {summary.verificationOrders.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl bg-violet-900/40 border border-violet-300/30 px-4 py-3 text-sm"
                  >
                    <span className="font-semibold">{o.orderNumber}</span>
                    <span className="text-amber-100 mx-2">·</span>
                    {formatPaise(o.pendingPaymentPaise)} submitted — admin will verify
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {payAllOpen && (
        <PaymentScannerModal
          orders={summary.orders}
          totalDuePaise={summary.totalDuePaise}
          initialMode={payAllMode}
          onClose={() => setPayAllOpen(false)}
          onPaid={() => router.refresh()}
        />
      )}
    </>
  );
}

export function PayOrderButton({
  orderId,
  orderNumber,
  balancePaise,
  totalPaise,
  paidPaise,
  allOrders,
  totalDuePaise,
}: {
  orderId: string;
  orderNumber: string;
  balancePaise: number;
  totalPaise: number;
  paidPaise: number;
  allOrders?: PayableOrderInfo[];
  totalDuePaise?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<"full" | "partial">("full");

  if (balancePaise <= 0) return null;

  const hasPriorPayment = paidPaise > 0;

  function openPay(mode: "full" | "partial") {
    setInitialMode(mode);
    setOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={() => openPay("full")}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700"
        >
          <IndianRupee className="w-3.5 h-3.5" />
          {hasPriorPayment ? `Pay Remaining (${formatPaise(balancePaise)})` : "Pay Now"}
        </button>
        <button
          type="button"
          onClick={() => openPay("partial")}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-brand-300 text-brand-700 text-xs font-semibold rounded-lg hover:bg-brand-50"
        >
          {hasPriorPayment ? "Pay Less" : "Pay Partial"}
        </button>
      </div>
      {open && (
        <PaymentScannerModal
          orders={allOrders ?? [{ id: orderId, orderNumber, totalPaise, paidPaise, balancePaise }]}
          totalDuePaise={totalDuePaise ?? balancePaise}
          orderId={orderId}
          orderNumber={orderNumber}
          maxAmountPaise={balancePaise}
          priorPaidPaise={paidPaise}
          initialMode={initialMode}
          onClose={() => setOpen(false)}
          onPaid={() => router.refresh()}
        />
      )}
    </>
  );
}
