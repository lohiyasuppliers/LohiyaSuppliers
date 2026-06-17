"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

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

export function VariationManager({ productId, variations, onChange }: VariationManagerProps) {
  const [saving, setSaving] = useState(false);

  function updateVariation(index: number, patch: Partial<VariationDraft>) {
    const next = [...variations];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function updateAttribute(index: number, key: string, value: string) {
    const next = [...variations];
    next[index] = {
      ...next[index],
      attributes: { ...next[index].attributes, [key]: value },
    };
    onChange(next);
  }

  function addAttributeKey(index: number) {
    const key = prompt("Attribute name (e.g. size, grit):");
    if (!key?.trim()) return;
    updateAttribute(index, key.trim(), "");
  }

  async function saveVariations() {
    if (!productId) return;
    setSaving(true);
    const res = await fetch(`/api/admin/products/${productId}/variations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variations }),
    });
    if (!res.ok) alert((await res.json()).error || "Failed to save variations");
    else alert("Variations saved!");
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Product Variations</h3>
          <p className="text-sm text-gray-500">Sizes, grits, and other purchasable variants</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...variations, emptyVariation()])}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100"
        >
          <Plus className="w-4 h-4" /> Add Variation
        </button>
      </div>

      {variations.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-lg">
          No variations yet. Add sizes, grits, or other options.
        </p>
      ) : (
        <div className="space-y-4">
          {variations.map((v, i) => (
            <div key={v.id || i} className="border rounded-xl p-4 bg-gray-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <span className="text-sm font-medium text-gray-700">Variation {i + 1}</span>
                <button
                  type="button"
                  onClick={() => onChange(variations.filter((_, idx) => idx !== i))}
                  className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">SKU *</label>
                  <input
                    required
                    value={v.sku}
                    onChange={(e) => updateVariation(i, { sku: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                    placeholder="DEER-INOX-4INCH"
                  />
                </div>
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
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Image URL</label>
                  <input
                    value={v.imageUrl}
                    onChange={(e) => updateVariation(i, { imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600">Attributes</label>
                  <button
                    type="button"
                    onClick={() => addAttributeKey(i)}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    + Add attribute
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(v.attributes).map(([key, val]) => (
                    <div key={key} className="flex gap-1">
                      <input
                        value={key}
                        readOnly
                        className="w-1/3 px-2 py-1.5 border rounded text-xs bg-gray-100"
                      />
                      <input
                        value={val}
                        onChange={(e) => updateAttribute(i, key, e.target.value)}
                        className="flex-1 px-2 py-1.5 border rounded text-xs"
                      />
                    </div>
                  ))}
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
