"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BannerFormProps {
  initial?: {
    id: string;
    title: string;
    subtitle: string | null;
    link: string | null;
    position: string;
    sortOrder: number;
    isActive: boolean;
  };
}

export function BannerForm({ initial }: BannerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title || "",
    subtitle: initial?.subtitle || "",
    link: initial?.link || "",
    position: initial?.position || "HERO",
    sortOrder: initial?.sortOrder?.toString() || "0",
    isActive: initial?.isActive ?? true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = initial ? `/api/admin/banners/${initial.id}` : "/api/admin/banners";
    const method = initial ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sortOrder: parseInt(form.sortOrder) }),
    });
    if (res.ok) router.push("/admin/banners");
    else alert("Failed to save banner");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 max-w-xl space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Title *</label>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm" />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Subtitle</label>
        <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm" />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Link URL</label>
        <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="/products" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Position</label>
          <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="HERO">Hero</option>
            <option value="INDUSTRY">Industry</option>
            <option value="PROMO">Promo</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Sort Order</label>
          <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        Active
      </label>
      <button type="submit" disabled={loading} className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
        {loading ? "Saving..." : initial ? "Update Banner" : "Create Banner"}
      </button>
    </form>
  );
}
