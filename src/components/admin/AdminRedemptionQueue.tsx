"use client";

import { useEffect, useState } from "react";
import { formatPaise, formatDate } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface RedemptionRow {
  id: string;
  type: string;
  amountPaise: number;
  status: string;
  upiId: string | null;
  clientNote: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string | null;
    email: string;
    clientProfile: { company: string } | null;
  };
}

export function AdminRedemptionQueue() {
  const [rows, setRows] = useState<RedemptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/redemptions?status=PENDING")
      .then((r) => r.json())
      .then((d) => setRows(d.redemptions ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAction(
    id: string,
    action: "approve" | "reject",
    extra?: { paymentProof?: string; adminComment?: string; amazonCode?: string; rejectionReason?: string }
  ) {
    setActing(id);
    const res = await fetch(`/api/admin/redemptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    if (res.ok) load();
    else {
      const d = await res.json();
      alert(d.error || "Failed");
    }
    setActing(null);
  }

  function promptApprove(row: RedemptionRow) {
    const proof = prompt(
      "Paste payment proof (UPI screenshot URL, transaction ID, or base64 image data):"
    );
    if (proof === null) return;
    const comment = prompt("Admin comment (optional):") ?? undefined;
    const amazonCode =
      row.type === "AMAZON_VOUCHER" ? prompt("Amazon gift card code:") ?? undefined : undefined;
    handleAction(row.id, "approve", {
      paymentProof: proof || undefined,
      adminComment: comment,
      amazonCode,
    });
  }

  function promptReject(row: RedemptionRow) {
    const reason = prompt("Rejection reason (cashback will be refunded to wallet):");
    if (!reason) return;
    handleAction(row.id, "reject", { rejectionReason: reason });
  }

  if (loading) {
    return <div className="h-24 bg-white rounded-xl border animate-pulse" />;
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border px-6 py-8 text-center text-sm text-gray-500">
        No pending UPI or gift card redemption requests.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Pending redemptions</h2>
        <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
          {rows.length} pending
        </span>
      </div>
      <div className="divide-y">
        {rows.map((row) => (
          <div key={row.id} className="px-6 py-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">
                {row.client.clientProfile?.company || row.client.name || row.client.email}
              </p>
              <p className="text-sm text-gray-500">{row.client.email}</p>
              <p className="text-lg font-bold text-brand-700 mt-1">
                {formatPaise(row.amountPaise)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {row.type === "UPI" ? "UPI transfer" : "Amazon gift card"} ·{" "}
                {formatDate(row.createdAt)}
              </p>
              {row.upiId && (
                <p className="text-sm font-mono mt-2 bg-gray-50 px-2 py-1 rounded inline-block">
                  {row.upiId}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={acting === row.id}
                onClick={() => promptApprove(row)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & send proof
              </button>
              <button
                type="button"
                disabled={acting === row.id}
                onClick={() => promptReject(row)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
