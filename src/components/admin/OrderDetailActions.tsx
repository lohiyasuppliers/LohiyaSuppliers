"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/utils";
import { CheckCircle, Loader2 } from "lucide-react";

export function OrderDetailActions({
  orderId,
  status,
  paymentStatus,
  trackingNumber,
  isVerified,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
  trackingNumber: string | null;
  isVerified: boolean;
}) {
  const router = useRouter();
  const [tracking, setTracking] = useState(trackingNumber || "");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function update(field: string, value: string) {
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    router.refresh();
    setSaving(false);
  }

  async function saveTracking() {
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber: tracking }),
    });
    router.refresh();
    setSaving(false);
  }

  async function verifyOrder() {
    if (!confirm("Verify this order and generate proforma invoice for the customer?")) return;
    setVerifying(true);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verify: true }),
    });
    if (!res.ok) alert((await res.json()).error || "Verification failed");
    router.refresh();
    setVerifying(false);
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <h2 className="font-bold text-gray-900">Update Order</h2>

      {!isVerified ? (
        <button
          onClick={verifyOrder}
          disabled={verifying}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {verifying ? "Generating..." : "Verify & Generate Proforma Invoice"}
        </button>
      ) : (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg font-medium text-center">
          ✓ Verified — Proforma invoice generated
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Order Status</label>
        <select value={status} onChange={(e) => update("status", e.target.value)} disabled={saving}
          className="w-full px-3 py-2 border rounded-lg text-sm">
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Payment Status</label>
        <select value={paymentStatus} onChange={(e) => update("paymentStatus", e.target.value)} disabled={saving}
          className="w-full px-3 py-2 border rounded-lg text-sm">
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Tracking Number</label>
        <div className="flex gap-2">
          <input value={tracking} onChange={(e) => setTracking(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Enter tracking ID" />
          <button onClick={saveTracking} disabled={saving}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm disabled:opacity-50">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
