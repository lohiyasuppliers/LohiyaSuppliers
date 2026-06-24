"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatPaise,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  paiseToRupees,
  rupeesToPaise,
  ORDER_STATUSES,
} from "@/lib/utils";
import { getOrderWorkflowState, getWorkflowSteps } from "@/lib/order-workflow";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  IndianRupee,
  Loader2,
  RotateCcw,
  XCircle,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

function AdminCommentBox({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
  placeholder = "Optional note for the client (e.g. payment terms, delivery info…)",
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-gray-800 mb-1.5">
        <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
        {label}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-y min-h-[72px] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 bg-white"
      />
    </div>
  );
}

type ProofDetails = {
  screenshot?: string | null;
  amountPaise?: number;
  submittedAt?: string;
};

export function AdminOrderWorkflowPanel({
  orderId,
  orderNumber,
  status,
  paymentStatus,
  totalPaise,
  paidPaise,
  pendingPaymentPaise,
  paymentProof,
  adminComment,
  rejectionReason,
}: {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalPaise: number;
  paidPaise: number;
  pendingPaymentPaise: number;
  paymentProof: string | null;
  adminComment?: string | null;
  rejectionReason?: string | null;
}) {
  const router = useRouter();
  const workflow = getOrderWorkflowState({
    status,
    paymentStatus,
    totalPaise,
    paidPaise,
    pendingPaymentPaise,
  });
  const steps = getWorkflowSteps();

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [correctionsOpen, setCorrectionsOpen] = useState(false);
  const [settleRupees, setSettleRupees] = useState(String(paiseToRupees(paidPaise)));
  const [orderApprovalComment, setOrderApprovalComment] = useState("");
  const [paymentActionComment, setPaymentActionComment] = useState("");

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
  const isPartialApproval = pendingPaymentPaise > 0 && afterApprovePaid < totalPaise;
  const settlementLocked = pendingPaymentPaise > 0;

  async function patch(body: Record<string, unknown>) {
    setError("");
    setSuccess("");
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Action failed");
    return data;
  }

  async function runAction(key: string, body: Record<string, unknown>, message?: string) {
    if (message && !confirm(message)) return;
    setLoading(key);
    setSuccess("");
    try {
      await patch(body);
      setSuccess("Action completed successfully");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  async function saveSettlement(amountPaise: number) {
    setLoading("settle");
    setError("");
    setSuccess("");
    try {
      const data = await patch({ paidPaise: amountPaise });
      setSettleRupees(String(paiseToRupees(data.paidPaise ?? amountPaise)));
      setSuccess("Payment settlement saved");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settlement failed");
    } finally {
      setLoading(null);
    }
  }

  function handleSaveSettlement() {
    const n = parseFloat(settleRupees.replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      setError("Enter a valid amount");
      return;
    }
    if (n > paiseToRupees(totalPaise)) {
      setError(`Cannot exceed bill total (${formatPaise(totalPaise)})`);
      return;
    }
    saveSettlement(rupeesToPaise(n));
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-scale-in">
      <div className="bg-gradient-to-r from-brand-700 via-brand-800 to-violet-900 text-white px-5 py-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" />
          Order &amp; Payment Workflow
        </h2>
        <p className="text-brand-100 text-sm mt-1">{orderNumber}</p>
      </div>

      <div className="px-4 py-5 border-b bg-gray-50/80 overflow-x-auto">
        <div className="flex min-w-[520px] items-start justify-between gap-0 relative">
          <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-gray-200 -z-0" aria-hidden />
          {steps.map((step, i) => {
            const done = i < workflow.stepIndex;
            const active = i === workflow.stepIndex;
            return (
              <div key={step.id} className="flex flex-1 flex-col items-center text-center relative z-10">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold border-2 transition-all duration-300 ${
                    done
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : active
                        ? "bg-brand-600 border-brand-600 text-white ring-4 ring-brand-100"
                        : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <p
                  className={`mt-2 text-[10px] sm:text-xs font-medium leading-tight max-w-[72px] ${
                    active ? "text-brand-800" : done ? "text-emerald-700" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Current step</p>
          <p className="font-bold text-gray-900 text-lg mt-1">{workflow.label}</p>
          <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-white border font-medium">
              Order: {getOrderStatusLabel(status)}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white border font-medium">
              Payment: {getPaymentStatusLabel(paymentStatus)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-gray-50 border p-3">
            <p className="text-gray-500 text-xs">Bill total</p>
            <p className="font-bold text-gray-900">{formatPaise(totalPaise)}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
            <p className="text-emerald-700 text-xs">Approved / settled</p>
            <p className="font-bold text-emerald-800">{formatPaise(paidPaise)}</p>
          </div>
          {pendingPaymentPaise > 0 && (
            <div className="rounded-lg bg-violet-50 border border-violet-200 p-3 col-span-2">
              <p className="text-violet-700 text-xs font-semibold">Submitted (pending your approval)</p>
              <p className="font-black text-violet-900 text-xl">{formatPaise(pendingPaymentPaise)}</p>
            </div>
          )}
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 col-span-2">
            <p className="text-amber-700 text-xs">Balance due (client sees this)</p>
            <p className="font-bold text-amber-900 text-lg">{formatPaise(workflow.balanceDue)}</p>
          </div>
        </div>

        {(adminComment || rejectionReason) && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Previous admin note</p>
            {adminComment && (
              <p className="text-gray-800">
                <span className="font-medium text-emerald-800">Comment: </span>
                {adminComment}
              </p>
            )}
            {rejectionReason && (
              <p className="text-gray-800">
                <span className="font-medium text-red-800">Rejection: </span>
                {rejectionReason}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
            {success}
          </p>
        )}

        {workflow.canApproveOrder && (
          <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 space-y-3">
            <p className="font-semibold text-amber-900">Step 1 — Approve order for payment</p>
            <p className="text-sm text-amber-800">
              Client chose pay later. Approve the order so they can pay from their dashboard.
            </p>
            <AdminCommentBox
              id="order-approval-comment"
              label="Comment (optional)"
              hint="Visible to the client on their orders page."
              value={orderApprovalComment}
              onChange={setOrderApprovalComment}
              disabled={loading !== null}
              placeholder="e.g. Order approved. You can pay full or partial from your account."
            />
            <button
              type="button"
              disabled={loading !== null}
              onClick={() =>
                runAction(
                  "approveOrder",
                  { approveOrder: true, adminComment: orderApprovalComment.trim() || undefined },
                  "Approve this order so the client can make payment?"
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {loading === "approveOrder" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Approve order
            </button>
          </div>
        )}

        {workflow.canApprovePayment && pendingPaymentPaise > 0 && (
          <div className="rounded-xl border-2 border-violet-300 bg-violet-50 p-4 space-y-4">
            <p className="font-semibold text-violet-900">Verify client payment</p>
            <p className="text-sm text-violet-800">
              Approve only <strong>{formatPaise(pendingPaymentPaise)}</strong> — not the full bill unless
              that is what they paid.
            </p>

            <div className="rounded-lg bg-white border border-violet-100 p-3 text-sm">
              <p className="text-gray-500 text-xs">After approval</p>
              <p className="font-semibold text-gray-900">
                {formatPaise(afterApprovePaid)} settled
                {isPartialApproval ? ` · ${formatPaise(remainingAfter)} still due` : " · fully paid"}
              </p>
            </div>

            {proof.screenshot && (
              <div className="animate-fade-in">
                <p className="text-gray-500 text-xs uppercase mb-2">Payment screenshot</p>
                {proof.submittedAt && (
                  <p className="text-xs text-gray-400 mb-2">
                    Submitted {new Date(proof.submittedAt).toLocaleString("en-IN")}
                  </p>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proof.screenshot}
                  alt="Payment screenshot"
                  className="max-w-full max-h-56 rounded-lg border bg-white"
                />
              </div>
            )}

            <AdminCommentBox
              id="payment-approval-comment"
              label="Comment (optional)"
              hint="Add a note when approving or rejecting — client will see it on their order."
              value={paymentActionComment}
              onChange={setPaymentActionComment}
              disabled={loading !== null}
              placeholder="e.g. Partial payment of ₹5,000 confirmed. Remaining balance due in 7 days."
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading !== null}
                onClick={() =>
                  runAction(
                    "approvePayment",
                    {
                      approvePayment: true,
                      adminComment: paymentActionComment.trim() || undefined,
                    },
                    isPartialApproval
                      ? `Approve partial payment of ${formatPaise(pendingPaymentPaise)}?\n\nAfter: ${formatPaise(afterApprovePaid)} paid, ${formatPaise(remainingAfter)} remaining.`
                      : `Approve full payment of ${formatPaise(pendingPaymentPaise)}?`
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-700 text-white text-sm font-semibold rounded-lg hover:bg-violet-800 disabled:opacity-50"
              >
                {loading === "approvePayment" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Approve {formatPaise(pendingPaymentPaise)}
                {isPartialApproval ? " (partial)" : ""}
              </button>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() =>
                  runAction("rejectPayment", {
                    rejectPayment: true,
                    adminComment: paymentActionComment.trim() || undefined,
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                {loading === "rejectPayment" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject payment
              </button>
            </div>
          </div>
        )}

        {workflow.canClientPay && !workflow.canApprovePayment && pendingPaymentPaise === 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="font-semibold text-blue-900">Waiting for client payment</p>
            <p className="text-sm text-blue-800 mt-1">
              Client can pay full or partial from their account. You will verify each submission here.
            </p>
          </div>
        )}

        {workflow.canEditSettlement && !settlementLocked && (
          <div className="rounded-xl border p-4 space-y-3">
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-brand-600" />
              Edit settled amount
            </p>
            <p className="text-sm text-gray-500">
              Correct a mistaken approval by changing how much is marked as settled.
            </p>
            <input
              type="number"
              min={0}
              max={paiseToRupees(totalPaise)}
              step="0.01"
              value={settleRupees}
              onChange={(e) => setSettleRupees(e.target.value)}
              disabled={loading !== null}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveSettlement}
                disabled={loading !== null}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {loading === "settle" ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null}
                Save amount
              </button>
              <button
                type="button"
                onClick={() => saveSettlement(totalPaise)}
                disabled={loading !== null}
                className="px-4 py-2 border border-emerald-200 text-emerald-800 text-sm rounded-lg hover:bg-emerald-50 disabled:opacity-50"
              >
                Mark fully settled
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirm("Clear all settlement to ₹0? Client will see full balance due.")) return;
                  saveSettlement(0);
                }}
                disabled={loading !== null}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Reset to ₹0
              </button>
            </div>
          </div>
        )}

        {settlementLocked && (
          <p className="text-sm text-violet-700 bg-violet-50 border border-violet-100 rounded-lg p-3">
            Approve or reject the pending client payment before editing settlement.
          </p>
        )}

        <div className="border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setCorrectionsOpen(!correctionsOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-800"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Corrections &amp; advanced
            </span>
            {correctionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {correctionsOpen && (
            <div className="p-4 space-y-4 border-t bg-white">
              {workflow.canRevertOrderApproval && (
                <div>
                  <p className="text-sm font-medium text-gray-800">Undo order approval</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Send order back to pending if you approved by mistake (no payments yet).
                  </p>
                  <button
                    type="button"
                    disabled={loading !== null}
                    onClick={() =>
                      runAction(
                        "revertOrder",
                        { revertOrderApproval: true },
                        "Revert order approval? Client will not be able to pay until you approve again."
                      )
                    }
                    className="mt-2 px-4 py-2 border border-amber-300 text-amber-800 text-sm font-medium rounded-lg hover:bg-amber-50 disabled:opacity-50"
                  >
                    Revert to pending approval
                  </button>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-800">Change fulfilment status</p>
                <select
                  value={status}
                  disabled={loading !== null}
                  onChange={(e) => runAction("status", { status: e.target.value })}
                  className="mt-2 w-full text-sm border rounded-lg px-3 py-2 bg-white"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {getOrderStatusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg bg-gray-50 border p-3 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">Quick reference</p>
                <p>1. Pay later → approve order</p>
                <p>2. Client pays → you approve submitted amount only</p>
                <p>3. Partial → client pays rest → you approve again</p>
                <p>4. Mistake? Reject pending pay, edit settled amount, or revert approval</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
