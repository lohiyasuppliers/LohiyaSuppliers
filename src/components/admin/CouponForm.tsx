"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { paiseToRupees } from "@/lib/money";

interface ClientOption {
  id: string;
  name: string | null;
  email: string;
  clientProfile: { company: string } | null;
}

interface CouponFormProps {
  clients: ClientOption[];
  initial?: {
    id: string;
    clientId: string;
    code: string;
    scope: string;
    type: string;
    valuePaise: number | null;
    valueBps: number | null;
    minOrderPaise: number;
    maxUses: number | null;
    expiresAt: Date | string | null;
    isActive: boolean;
  };
}

export function CouponForm({ clients, initial }: CouponFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientId: initial?.clientId || clients[0]?.id || "",
    code: initial?.code || "",
    scope: initial?.scope || "WHOLE_BILL",
    type: initial?.type || "PERCENTAGE",
    discountValue:
      initial?.type === "FIXED"
        ? String(paiseToRupees(initial.valuePaise || 0))
        : String((initial?.valueBps || 0) / 100 || ""),
    minOrder: String(paiseToRupees(initial?.minOrderPaise || 0)),
    maxUses: initial?.maxUses?.toString() || "",
    expiresAt: initial?.expiresAt
      ? new Date(initial.expiresAt).toISOString().slice(0, 10)
      : "",
    isActive: initial?.isActive ?? true,
  });

  useEffect(() => {
    if (!form.clientId && clients[0]?.id) {
      setForm((f) => ({ ...f, clientId: clients[0].id }));
    }
  }, [clients, form.clientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = initial ? `/api/admin/coupons/${initial.id}` : "/api/admin/coupons";
    const method = initial ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: form.clientId,
        code: form.code.toUpperCase(),
        scope: form.scope,
        type: form.type,
        discountValue: parseFloat(form.discountValue),
        minOrder: parseFloat(form.minOrder) || 0,
        maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      }),
    });
    if (res.ok) router.push("/admin/coupons");
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to save voucher");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 max-w-xl space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Client *</label>
        <select
          required
          disabled={!!initial}
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.clientProfile?.company || c.name || c.email} ({c.email})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Code *</label>
          <input
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Scope</label>
          <select
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="WHOLE_BILL">Whole bill</option>
            <option value="PRODUCT">Product</option>
            <option value="SERVICE">Service</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed ₹</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">
            {form.type === "FIXED" ? "Amount (₹) *" : "Percent % *"}
          </label>
          <input
            required
            type="number"
            step="0.01"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Min Order (₹)</label>
          <input
            type="number"
            value={form.minOrder}
            onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Max Uses</label>
          <input
            type="number"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="Unlimited"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Expires</label>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
        />
        Active
      </label>
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Saving..." : initial ? "Update Voucher" : "Create Voucher"}
      </button>
    </form>
  );
}
