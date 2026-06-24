"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPaise, getPaymentStatusLabel, paiseToRupees, rupeesToPaise } from "@/lib/utils";
import { CheckCircle, Loader2, IndianRupee } from "lucide-react";

export function AdminPaymentSettlement({
  orderId,
  totalPaise,
  paidPaise,
  pendingPaymentPaise,
  paymentStatus,
}: {
  orderId: string;
  totalPaise: number;
  paidPaise: number;
  pendingPaymentPaise: number;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [rupees, setRupees] = useState(String(paiseToRupees(paidPaise)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const balanceDue = Math.max(0, totalPaise - paidPaise - pendingPaymentPaise);
  const locked = pendingPaymentPaise > 0;

  useEffect(() => {
    setRupees(String(paiseToRupees(paidPaise)));
  }, [paidPaise]);

  async function saveSettledAmount(amountPaise: number) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidPaise: amountPaise }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settlement");
      setSuccess("Payment settlement saved");
      setRupees(String(paiseToRupees(data.paidPaise ?? amountPaise)));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update settlement");
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    const n = parseFloat(rupees.replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      setError("Enter a valid amount");
      return;
    }
    if (n > paiseToRupees(totalPaise)) {
      setError(`Cannot exceed bill total (${formatPaise(totalPaise)})`);
      return;
    }
    saveSettledAmount(rupeesToPaise(n));
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div>
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-brand-600" />
          Payment Settlement
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Set how much has been approved/settled on this bill. Remaining balance shows on the client
          dashboard.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-gray-50 border p-3">
          <p className="text-gray-500 text-xs">Bill total</p>
          <p className="font-bold text-gray-900">{formatPaise(totalPaise)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 border p-3">
          <p className="text-gray-500 text-xs">Status</p>
          <p className="font-semibold text-gray-900">{getPaymentStatusLabel(paymentStatus)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
          <p className="text-emerald-700 text-xs">Settled (approved)</p>
          <p className="font-bold text-emerald-800">{formatPaise(paidPaise)}</p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
          <p className="text-amber-700 text-xs">Balance due</p>
          <p className="font-bold text-amber-900">{formatPaise(balanceDue)}</p>
        </div>
      </div>

      {locked ? (
        <p className="text-sm text-violet-700 bg-violet-50 border border-violet-100 rounded-lg p-3">
          A client payment of {formatPaise(pendingPaymentPaise)} is awaiting verification. Approve or
          reject it above before editing settlement manually.
        </p>
      ) : (
        <>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Settled amount (₹)
            </label>
            <input
              type="number"
              min={0}
              max={paiseToRupees(totalPaise)}
              step="0.01"
              value={rupees}
              onChange={(e) => setRupees(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: bill {formatPaise(totalPaise)} — enter 5000 to settle ₹5,000 only.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Save settlement
            </button>
            <button
              type="button"
              onClick={() => saveSettledAmount(totalPaise)}
              disabled={saving}
              className="px-4 py-2.5 border border-emerald-200 text-emerald-800 text-sm font-medium rounded-lg hover:bg-emerald-50 disabled:opacity-50"
            >
              Mark fully settled
            </button>
            <button
              type="button"
              onClick={() => saveSettledAmount(0)}
              disabled={saving}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Clear settlement
            </button>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
          {success}
        </p>
      )}
    </div>
  );
}
