"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BannerFormProps {
  initial?: {
    id: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    linkUrl: string | null;
    sortOrder: number;
    isActive: boolean;
  };
}

export function BannerForm({ initial }: BannerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title || "",
    subtitle: initial?.subtitle || "",
    imageUrl: initial?.imageUrl || "",
    linkUrl: initial?.linkUrl || "",
    sortOrder: initial?.sortOrder?.toString() || "0",
    isActive: initial?.isActive ?? true,
  });

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Upload failed");
        return;
      }
      setForm((f) => ({ ...f, imageUrl: data.url }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl.trim()) {
      alert("Image is required");
      return;
    }
    setLoading(true);
    const url = initial ? `/api/admin/banners/${initial.id}` : "/api/admin/banners";
    const method = initial ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        subtitle: form.subtitle || null,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || null,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        isActive: form.isActive,
      }),
    });
    if (res.ok) router.push("/admin/banners");
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to save banner");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 max-w-xl space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Title *</label>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Subtitle</label>
        <input
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Image *</label>
        <input
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
          placeholder="/uploads/products/…"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadImage(file);
          }}
          className="text-sm"
        />
        {uploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
        {form.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.imageUrl} alt="" className="mt-2 h-28 rounded-lg object-cover border" />
        )}
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Link URL</label>
        <input
          value={form.linkUrl}
          onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm"
          placeholder="/products"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Sort Order</label>
        <input
          type="number"
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
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
        disabled={loading || uploading}
        className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Saving..." : initial ? "Update Banner" : "Create Banner"}
      </button>
    </form>
  );
}
