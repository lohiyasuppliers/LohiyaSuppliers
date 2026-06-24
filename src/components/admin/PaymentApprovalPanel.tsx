"use client";

import { useState } from "react";
import { formatPaise } from "@/lib/utils";
import { CheckCircle, Loader2, XCircle, IndianRupee } from "lucide-react";

type ProofDetails = {
  screenshot?: string | null;
  amountPaise?: number;
  submittedAt?: string;
};

export function PaymentApprovalPanel({
  orderId,
  orderNumber,
  totalPaise,
  paidPaise,
  pendingPaymentPaise,
  paymentProof,
}: {
  orderId: string;
  orderNumber: string;
  totalPaise: number;
  paidPaise: number;
  pendingPaymentPaise: number;
  paymentProof: string | null;
}) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  if (pendingPaymentPaise <= 0) return null;

  let proof: ProofDetails = {};
  if (paymentProof) {
    try {
      proof = JSON.parse(paymentProof) as ProofDetails;
    } catch {
      proof = {};
    }
  }

  const afterApprovePaid = paidPaise + pendingPaymentPaise;
  const remainingAfter = Math.max(0, totalPaise - afterApprovePaid);
  const isPartial = afterApprovePaid < totalPaise;

  async function approve() {
    const msg = isPartial
      ? `Approve partial payment of ${formatPaise(pendingPaymentPaise)}?\n\nBill: ${formatPaise(totalPaise)}\nAfter approval: ${formatPaise(afterApprovePaid)} paid, ${formatPaise(remainingAfter)} still due.`
      : `Approve full payment of ${formatPaise(pendingPaymentPaise)}?`;
    if (!confirm(msg)) return;

    setLoading("approve");
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvePayment: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setLoading(null);
    }
  }

  async function reject() {
    const reason = prompt("Reason for rejection (optional):") ?? "";
    if (reason === null) return;

    setLoading("reject");
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectPayment: true, rejectionReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-violet-50 border-2 border-violet-300 rounded-xl p-5 space-y-4">
      <div>
        <h2 className="font-bold text-violet-900 flex items-center gap-2">
          <IndianRupee className="w-5 h-5" />
          Partial Payment — Awaiting Verification
        </h2>
        <p className="text-sm text-violet-700 mt-1">
          Client submitted a payment for <strong>{orderNumber}</strong>. Approve only the submitted
          amount — not the full bill.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-white border border-violet-100 p-3">
          <p className="text-gray-500 text-xs uppercase">Bill total</p>
          <p className="font-bold text-gray-900 text-lg">{formatPaise(totalPaise)}</p>
        </div>
        <div className="rounded-lg bg-white border border-violet-100 p-3">
          <p className="text-gray-500 text-xs uppercase">Already paid</p>
          <p className="font-bold text-emerald-700 text-lg">{formatPaise(paidPaise)}</p>
        </div>
        <div className="rounded-lg bg-violet-100 border border-violet-200 p-3 col-span-2">
          <p className="text-violet-700 text-xs uppercase font-semibold">Submitted (approve this)</p>
          <p className="font-black text-violet-900 text-2xl">{formatPaise(pendingPaymentPaise)}</p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 col-span-2">
          <p className="text-amber-700 text-xs uppercase">Remaining after approval</p>
          <p className="font-bold text-amber-900 text-lg">
            {isPartial ? formatPaise(remainingAfter) : "₹0 — fully settled"}
          </p>
        </div>
      </div>

      {proof.screenshot && (
        <div>
          <p className="text-gray-500 text-xs uppercase mb-2">Payment Screenshot</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proof.screenshot}
            alt="Payment screenshot"
            className="max-w-full max-h-72 rounded-lg border border-violet-200 bg-white"
          />
        </div>
      )}

      {proof.submittedAt && (
        <p className="text-sm text-gray-600">
          Submitted: {new Date(proof.submittedAt).toLocaleString("en-IN")}
        </p>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={approve}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-700 text-white text-sm font-semibold rounded-lg hover:bg-violet-800 disabled:opacity-50"
        >
          {loading === "approve" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          Approve {formatPaise(pendingPaymentPaise)}
          {isPartial ? " (partial)" : ""}
        </button>
        <button
          type="button"
          onClick={reject}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50"
        >
          {loading === "reject" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          Reject
        </button>
      </div>
    </div>
  );
}
