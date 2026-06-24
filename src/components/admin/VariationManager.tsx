"use client";

import { useState } from "react";
import { Plus, Trash2, Sparkles, X } from "lucide-react";
import { generateVariationSku } from "@/lib/sku";
import { sanitizeAttributes } from "@/lib/attributes";

export interface VariationDraft {
  id?: string;
  sku: string;
  attributes: Record<string, string>;
  priceRupees: string;
  imageUrl: string;
  isActive: boolean;
}

interface VariationManagerProps {
  productId?: string;
  productSlug: string;
  brand: string;
  variations: VariationDraft[];
  onChange: (variations: VariationDraft[]) => void;
}

const emptyVariation = (): VariationDraft => ({
  sku: "",
  attributes: { size: "" },
  priceRupees: "",
  imageUrl: "",
  isActive: true,
});

function withGeneratedSku(
  v: VariationDraft,
  index: number,
  productSlug: string,
  brand: string
): VariationDraft {
  const attrs = sanitizeAttributes(v.attributes);
  const hasAttrs = Object.values(attrs).some((val) => val);
  if (!hasAttrs) return { ...v, attributes: attrs };
  return {
    ...v,
    attributes: attrs,
    sku: generateVariationSku(brand, productSlug, attrs, index),
  };
}

export function VariationManager({
  productId,
  productSlug,
  brand,
  variations,
  onChange,
}: VariationManagerProps) {
  const [saving, setSaving] = useState(false);
  const [newAttrKey, setNewAttrKey] = useState<Record<number, string>>({});

  function updateVariations(next: VariationDraft[]) {
    onChange(next.map((v, i) => withGeneratedSku(v, i, productSlug, brand)));
  }

  function updateVariation(index: number, patch: Partial<VariationDraft>) {
    const next = [...variations];
    next[index] = { ...next[index], ...patch };
    updateVariations(next);
  }

  function updateAttributeValue(index: number, key: string, value: string) {
    const next = [...variations];
    next[index] = {
      ...next[index],
      attributes: { ...next[index].attributes, [key]: value },
    };
    updateVariations(next);
  }

  function renameAttributeKey(index: number, oldKey: string, rawNewKey: string) {
    const newKey = rawNewKey.trim().toLowerCase();
    if (!newKey || newKey === oldKey) return;
    const next = [...variations];
    const attrs = { ...next[index].attributes };
    if (newKey in attrs && newKey !== oldKey) {
      alert(`Attribute "${newKey}" already exists on this variation.`);
      return;
    }
    attrs[newKey] = attrs[oldKey] ?? "";
    delete attrs[oldKey];
    next[index] = { ...next[index], attributes: attrs };
    updateVariations(next);
  }

  function removeAttributeKey(index: number, key: string) {
    const next = [...variations];
    const attrs = { ...next[index].attributes };
    delete attrs[key];
    next[index] = { ...next[index], attributes: attrs };
    updateVariations(next);
  }

  function addAttributeKey(index: number) {
    const key = (newAttrKey[index] || "").trim().toLowerCase();
    if (!key) return;
    if (key in variations[index].attributes) {
      alert(`Attribute "${key}" already exists.`);
      return;
    }
    setNewAttrKey((prev) => ({ ...prev, [index]: "" }));
    updateAttributeValue(index, key, "");
  }

  async function saveVariations() {
    if (!productId) return;
    setSaving(true);
    const payload = variations.map((v, i) =>
      withGeneratedSku(v, i, productSlug, brand)
    );
    const res = await fetch(`/api/admin/products/${productId}/variations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variations: payload }),
    });
    if (!res.ok) alert((await res.json()).error || "Failed to save variations");
    else {
      const updated = await res.json();
      onChange(
        updated.map(
          (v: {
            id: string;
            sku: string;
            attributes: Record<string, string>;
            defaultPricePaise: number | null;
            imageUrl: string | null;
            isActive: boolean;
          }) => ({
            id: v.id,
            sku: v.sku,
            attributes: v.attributes,
            priceRupees:
              v.defaultPricePaise != null ? (v.defaultPricePaise / 100).toString() : "",
            imageUrl: v.imageUrl || "",
            isActive: v.isActive,
          })
        )
      );
      alert("Variations saved!");
    }
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            Product Variations
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Edit attribute names (size, grit, etc.) and values — SKU updates automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => updateVariations([...variations, emptyVariation()])}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100"
        >
          <Plus className="w-4 h-4" /> Add Variation
        </button>
      </div>

      {variations.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-lg">
          No variations yet. Add options with attributes like size or grit.
        </p>
      ) : (
        <div className="space-y-4">
          {variations.map((v, i) => (
            <div key={v.id || i} className="border rounded-xl p-4 bg-gray-50/50 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Variation {i + 1}</span>
                {v.sku && (
                  <code className="text-xs font-mono bg-brand-50 text-brand-800 px-2 py-0.5 rounded">
                    {v.sku}
                  </code>
                )}
                <button
                  type="button"
                  onClick={() => updateVariations(variations.filter((_, idx) => idx !== i))}
                  className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded"
                  aria-label="Remove variation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={v.priceRupees}
                    onChange={(e) => updateVariation(i, { priceRupees: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Image URL (optional)
                  </label>
                  <input
                    value={v.imageUrl}
                    onChange={(e) => updateVariation(i, { imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-2">
                  Attributes (name + value — drives SKU &amp; storefront dropdowns)
                </label>
                <div className="space-y-2">
                  {Object.entries(v.attributes).map(([key, val]) => (
                    <div key={`${i}-${key}`} className="flex gap-2 items-center">
                      <input
                        defaultValue={key}
                        onBlur={(e) => renameAttributeKey(i, key, e.target.value)}
                        placeholder="e.g. size"
                        className="w-28 px-2 py-1.5 border rounded-lg text-xs capitalize bg-white"
                        title="Attribute name (editable)"
                      />
                      <input
                        value={val}
                        onChange={(e) => updateAttributeValue(i, key, e.target.value)}
                        placeholder="e.g. 4 inch"
                        className="flex-1 px-2 py-1.5 border rounded-lg text-sm bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttributeKey(i, key)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        aria-label={`Remove ${key}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 items-center pt-1">
                    <input
                      value={newAttrKey[i] || ""}
                      onChange={(e) =>
                        setNewAttrKey((prev) => ({ ...prev, [i]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttributeKey(i))}
                      placeholder="New attribute (e.g. grit)"
                      className="w-36 px-2 py-1.5 border border-dashed rounded-lg text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => addAttributeKey(i)}
                      className="text-xs text-brand-600 hover:underline font-medium"
                    >
                      + Add attribute
                    </button>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={v.isActive}
                  onChange={(e) => updateVariation(i, { isActive: e.target.checked })}
                />
                Active
              </label>
            </div>
          ))}
        </div>
      )}

      {productId && variations.length > 0 && (
        <button
          type="button"
          onClick={saveVariations}
          disabled={saving}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Variations"}
        </button>
      )}
    </div>
  );
}
