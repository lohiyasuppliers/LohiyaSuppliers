"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify, parseJSON } from "@/lib/utils";
import { generateVariationSku } from "@/lib/sku";
import { DEFAULT_GST_RATE_PERCENT } from "@/lib/constants";
import { ImageUpload } from "./ImageUpload";
import { VariationManager, VariationDraft } from "./VariationManager";

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: { name: string } | null;
}

interface ProductFormProps {
  categories: Category[];
  initialData?: {
    id: string;
    name: string;
    slug: string;
    brand: string | null;
    description: string;
    hsnCode: string;
    gstRateBps: number;
    defaultPricePaise: number;
    categoryId: string;
    isActive: boolean;
    images: string;
  };
  initialVariations?: VariationDraft[];
}

const BRAND_OPTIONS = ["Deerfros", "Leitz", "AIPL", "Other"];

export function ProductForm({ categories, initialData, initialVariations = [] }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(
    parseJSON<string[]>(initialData?.images || "[]", [])
  );
  const [variations, setVariations] = useState<VariationDraft[]>(initialVariations);
  const [form, setForm] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    brand: initialData?.brand || "Deerfros",
    description: initialData?.description || "",
    hsnCode: initialData?.hsnCode || "6804",
    priceRupees: initialData ? (initialData.defaultPricePaise / 100).toString() : "",
    categoryId: initialData?.categoryId || categories.find((c) => c.parentId)?.id || categories[0]?.id || "",
    isActive: initialData?.isActive ?? true,
  });

  const leafCategories = categories.filter((c) => c.parentId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = initialData ? `/api/admin/products/${initialData.id}` : "/api/admin/products";
    const method = initialData ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug,
        brand: form.brand || null,
        description: form.description,
        hsnCode: form.hsnCode,
        gstRateBps: DEFAULT_GST_RATE_PERCENT * 100,
        defaultPriceRupees: parseFloat(form.priceRupees),
        categoryId: form.categoryId,
        isActive: form.isActive,
        images: JSON.stringify(images),
      }),
    });

    if (res.ok) {
      const product = await res.json();
      if (variations.length > 0) {
        const withSkus = variations.map((v, i) => ({
          ...v,
          sku: v.sku || generateVariationSku(form.brand, form.slug, v.attributes, i),
        }));
        await fetch(`/api/admin/products/${product.id}/variations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variations: withSkus }),
        });
      }
      router.push("/admin/products");
    } else {
      alert((await res.json()).error || "Failed to save product");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-6">
        <ImageUpload images={images} onChange={setImages} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">Product Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Brand</label>
            <select
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {BRAND_OPTIONS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">Subcategory *</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {leafCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent?.name ? `${c.parent.name} → ` : ""}{c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">GST Rate</label>
            <input
              readOnly
              type="text"
              value={`${DEFAULT_GST_RATE_PERCENT}% (fixed)`}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Default Price (₹) *</label>
            <input
              required
              type="number"
              step="0.01"
              value={form.priceRupees}
              onChange={(e) => setForm({ ...form, priceRupees: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">Description *</label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : initialData ? "Update Product" : "Create Product"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded-lg text-sm">
            Cancel
          </button>
        </div>
      </form>

      <VariationManager
        productId={initialData?.id}
        productSlug={form.slug}
        brand={form.brand}
        variations={variations}
        onChange={setVariations}
      />
    </div>
  );
}
