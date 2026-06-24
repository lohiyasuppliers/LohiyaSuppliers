"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPaise, formatDate } from "@/lib/utils";
import { ArrowLeft, Gift, Tag, Plus, Save, Trash2 } from "lucide-react";

export default function AdminClientRewardsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const [clientId, setClientId] = useState("");
  const [data, setData] = useState<{
    client: { name: string | null; email: string; clientProfile: { company: string } | null };
    balances: { availablePaise: number; lockedPaise: number };
    wallet: Array<{
      id: string;
      amountPaise: number;
      status: string;
      expiresAt: string;
      adminNote: string | null;
      order: { orderNumber: string } | null;
    }>;
  } | null>(null);
  const [grantRupees, setGrantRupees] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setClientId(p.clientId));
  }, [params]);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    fetch(`/api/admin/rewards/${clientId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [clientId]);

  async function grantCashback() {
    const res = await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant", clientId, amountRupees: grantRupees }),
    });
    if (res.ok) {
      setGrantRupees("");
      const refreshed = await fetch(`/api/admin/rewards/${clientId}`).then((r) => r.json());
      setData(refreshed);
    } else {
      alert((await res.json()).error || "Failed");
    }
  }

  async function updateEntry(
    entryId: string,
    patch: { amountRupees?: string; expiresAt?: string; status?: string }
  ) {
    await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_entry", clientId, entryId, ...patch }),
    });
    const refreshed = await fetch(`/api/admin/rewards/${clientId}`).then((r) => r.json());
    setData(refreshed);
  }

  async function deleteEntry(entryId: string) {
    if (!confirm("Delete this wallet entry?")) return;
    await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_entry", clientId, entryId }),
    });
    const refreshed = await fetch(`/api/admin/rewards/${clientId}`).then((r) => r.json());
    setData(refreshed);
  }

  async function extendAll() {
    await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extend_all", clientId, days: 30 }),
    });
    const refreshed = await fetch(`/api/admin/rewards/${clientId}`).then((r) => r.json());
    setData(refreshed);
    alert("Extended all active entries by 30 days");
  }

  if (loading || !data) {
    return <div className="h-64 bg-white rounded-xl border animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/rewards" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> All clients
      </Link>

      <div className="bg-white rounded-xl border p-6">
        <h1 className="text-xl font-bold">{data.client.name || data.client.email}</h1>
        <p className="text-sm text-gray-500">{data.client.clientProfile?.company}</p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-xs text-amber-700">Available cashback</p>
            <p className="text-2xl font-bold text-amber-900">
              {formatPaise(data.balances.availablePaise)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border">
            <p className="text-xs text-gray-500">Locked cashback</p>
            <p className="text-2xl font-bold">{formatPaise(data.balances.lockedPaise)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link
            href={`/admin/users/${clientId}`}
            className="text-sm text-brand-600 font-medium hover:underline"
          >
            Edit discount & earning rules on client page →
          </Link>
          <button
            type="button"
            onClick={extendAll}
            className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50"
          >
            Extend all expiry +30 days
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-bold flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4" /> Grant cashback
        </h2>
        <div className="flex gap-2 max-w-sm">
          <input
            type="number"
            value={grantRupees}
            onChange={(e) => setGrantRupees(e.target.value)}
            placeholder="Amount ₹"
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={grantCashback}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium"
          >
            Grant
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <h2 className="font-bold p-4 border-b flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-600" />
          Wallet entries
        </h2>
        <div className="divide-y max-h-[28rem] overflow-y-auto">
          {data.wallet.map((e) => (
            <div key={e.id} className="p-4 flex flex-wrap items-center gap-3 text-sm">
              <div className="flex-1 min-w-[200px]">
                <p className="font-bold">{formatPaise(e.amountPaise)}</p>
                <p className="text-xs text-gray-500">
                  {e.status} · expires {formatDate(e.expiresAt)}
                  {e.order ? ` · ${e.order.orderNumber}` : ""}
                </p>
              </div>
              <input
                type="number"
                defaultValue={(e.amountPaise / 100).toString()}
                onBlur={(ev) =>
                  updateEntry(e.id, { amountRupees: ev.target.value })
                }
                className="w-24 px-2 py-1 border rounded-lg"
                title="Edit amount ₹"
              />
              <input
                type="date"
                defaultValue={e.expiresAt.slice(0, 10)}
                onChange={(ev) =>
                  updateEntry(e.id, { expiresAt: ev.target.value })
                }
                className="px-2 py-1 border rounded-lg"
              />
              <select
                defaultValue={e.status}
                onChange={(ev) =>
                  updateEntry(e.id, { status: ev.target.value })
                }
                className="px-2 py-1 border rounded-lg"
              >
                <option value="LOCKED">Locked</option>
                <option value="AVAILABLE">Available</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <button
                type="button"
                onClick={() => deleteEntry(e.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {data.wallet.length === 0 && (
            <p className="p-8 text-center text-gray-500">No wallet entries yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
