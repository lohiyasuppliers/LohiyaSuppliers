"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CouponFormProps {
  initial?: {
    id: string;
    code: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    minOrder: number;
    maxUses: number | null;
    isActive: boolean;
  };
}

export function CouponForm({ initial }: CouponFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: initial?.code || "",
    description: initial?.description || "",
    discountType: initial?.discountType || "PERCENTAGE",
    discountValue: initial?.discountValue?.toString() || "",
    minOrder: initial?.minOrder?.toString() || "0",
    maxUses: initial?.maxUses?.toString() || "",
    isActive: initial?.isActive ?? true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = initial ? `/api/admin/coupons/${initial.id}` : "/api/admin/coupons";
    const method = initial ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        code: form.code.toUpperCase(),
        discountValue: parseFloat(form.discountValue),
        minOrder: parseFloat(form.minOrder),
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      }),
    });
    if (res.ok) router.push("/admin/coupons");
    else alert("Failed to save coupon");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Code *</label>
          <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Type</label>
          <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed Amount</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Description</label>
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Discount Value *</label>
          <input required type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Min Order (₹)</label>
          <input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Max Uses</label>
          <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Unlimited" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        Active
      </label>
      <button type="submit" disabled={loading} className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
        {loading ? "Saving..." : initial ? "Update Coupon" : "Create Coupon"}
      </button>
    </form>
  );
}
