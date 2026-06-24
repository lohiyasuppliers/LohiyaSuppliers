"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Tag,
  Search,
  Save,
  ChevronDown,
  ChevronRight,
  Plus,
  Filter,
  X,
} from "lucide-react";
import { formatPaise } from "@/lib/utils";
import { PRODUCT_LEVEL_VARIATION_ID } from "@/lib/constants";

interface VariationRow {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  defaultPricePaise: number;
  discountValuePaise: number | null;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string;
  defaultPricePaise: number;
  discountValuePaise: number | null;
  variations: VariationRow[];
  hasRule?: boolean;
}

type ViewScope = "custom" | "all";

function variationLabel(attrs: Record<string, string>) {
  return Object.values(attrs).filter(Boolean).join(" · ") || "Variant";
}

function paiseToRupees(p: number | null) {
  return p != null ? (p / 100).toString() : "";
}

function draftFromProducts(rows: ProductRow[]) {
  const initial: Record<string, string> = {};
  for (const p of rows) {
    const pk = `${p.id}:${PRODUCT_LEVEL_VARIATION_ID}`;
    if (p.discountValuePaise != null) {
      initial[pk] = paiseToRupees(p.discountValuePaise);
    }
    for (const v of p.variations) {
      const vk = `${p.id}:${v.id}`;
      if (v.discountValuePaise != null) initial[vk] = paiseToRupees(v.discountValuePaise);
    }
  }
  return initial;
}

export function ClientDiscountManager({ clientId }: { clientId: string }) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savedDraft, setSavedDraft] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [ruleCount, setRuleCount] = useState(0);
  const [viewScope, setViewScope] = useState<ViewScope>("custom");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDiscounts = useCallback(
    async (scope: ViewScope) => {
      setLoading(true);
      const res = await fetch(`/api/admin/users/${clientId}/discount?scope=${scope}`);
      const data = await res.json();
      const rows: ProductRow[] = data.products || [];
      setProducts(rows);
      setBrands(data.brands || []);
      setCategories(data.categories || []);
      setRuleCount(data.ruleCount ?? 0);
      const initial = draftFromProducts(rows);
      setDraft(initial);
      setSavedDraft(initial);
      setExpanded(new Set(rows.map((p) => p.id)));
      setLoading(false);
    },
    [clientId]
  );

  useEffect(() => {
    loadDiscounts(viewScope);
  }, [loadDiscounts, viewScope]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (brandFilter && p.brand !== brandFilter) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (!q) return true;

      if (
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      ) {
        return true;
      }

      return p.variations.some((v) => {
        const attrs = Object.values(v.attributes || {}).join(" ").toLowerCase();
        return v.sku.toLowerCase().includes(q) || attrs.includes(q);
      });
    });
  }, [products, search, brandFilter, categoryFilter]);

  const hasActiveFilters = !!(search.trim() || brandFilter || categoryFilter);

  function setDiscount(key: string, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setBrandFilter("");
    setCategoryFilter("");
  }

  async function handleSave() {
    setSaving(true);
    const keys = new Set([...Object.keys(draft), ...Object.keys(savedDraft)]);
    const rules: { productId: string; variationId: string; discountRupees: string | null }[] =
      [];

    for (const key of keys) {
      const [productId, variationId] = key.split(":");
      if (!productId || !variationId) continue;
      const value = draft[key]?.trim() ?? "";
      const hadSaved = savedDraft[key]?.trim();
      if (value) {
        rules.push({ productId, variationId, discountRupees: draft[key] });
      } else if (hadSaved) {
        rules.push({ productId, variationId, discountRupees: null });
      }
    }

    const res = await fetch(`/api/admin/users/${clientId}/discount`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules }),
    });

    if (res.ok) {
      const data = await res.json();
      alert(`Discount saved! ${data.ruleCount} product/variant discount rule(s) active.`);
      await loadDiscounts(viewScope);
    } else {
      alert((await res.json()).error || "Failed to save discount");
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="bg-white rounded-xl border p-8 h-48 animate-pulse" />;
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-5 border-b bg-emerald-50/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            B2B Product Discount
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {viewScope === "custom"
              ? `Showing ${ruleCount} discount rule(s). Set per-unit discount per product or variant — summed at checkout when client ticks discount.`
              : "Browse the full catalog to set product or variant discount for this client."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {viewScope === "custom" ? (
            <button
              type="button"
              onClick={() => setViewScope("all")}
              className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium hover:bg-emerald-50"
            >
              <Plus className="w-4 h-4" />
              Add More Discounts
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setViewScope("custom")}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Show Set Rules Only
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Discounts"}
          </button>
        </div>
      </div>

      <div className="p-4 border-b bg-gray-50/50 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <Filter className="w-3.5 h-3.5" />
          Search &amp; filters
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, brand, SKU, variant..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white"
            />
          </div>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[140px]"
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[160px]"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[32rem] overflow-y-auto divide-y">
        {filtered.map((p) => {
          const isOpen = expanded.has(p.id);
          const productKey = `${p.id}:${PRODUCT_LEVEL_VARIATION_ID}`;
          const productHasRule = !!draft[productKey]?.trim() || p.discountValuePaise != null;

          const visibleVariations =
            viewScope === "custom"
              ? p.variations.filter(
                  (v) => draft[`${p.id}:${v.id}`]?.trim() || v.discountValuePaise != null
                )
              : p.variations;

          const showProductRow =
            viewScope === "all" || productHasRule || visibleVariations.length > 0;

          if (!showProductRow) return null;

          return (
            <div key={p.id} className="bg-white">
              <div className="flex items-center gap-3 p-4 hover:bg-gray-50/80">
                {visibleVariations.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(p.id)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                ) : (
                  <span className="w-6" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.brand || "—"} · {p.category}
                    {productHasRule && (
                      <span className="ml-2 text-emerald-700 font-medium">Product discount set</span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs text-gray-500">List price</p>
                  <p className="text-sm font-medium">{formatPaise(p.defaultPricePaise)}</p>
                </div>
                {(viewScope === "all" || productHasRule) && (
                  <div className="w-32 shrink-0">
                    <label className="text-xs text-emerald-700 block mb-0.5">Discount ₹ / unit</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="None"
                      value={draft[productKey] ?? ""}
                      onChange={(e) => setDiscount(productKey, e.target.value)}
                      className="w-full px-2 py-1.5 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-300"
                    />
                  </div>
                )}
              </div>

              {isOpen && visibleVariations.length > 0 && (
                <div className="px-4 pb-4 pl-12 space-y-2">
                  {visibleVariations.map((v) => {
                    const varKey = `${p.id}:${v.id}`;
                    const variantHasRule =
                      !!draft[varKey]?.trim() || v.discountValuePaise != null;
                    return (
                      <div
                        key={v.id}
                        className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                          variantHasRule
                            ? "bg-emerald-50/80 border border-emerald-100"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 capitalize">
                            {variationLabel(v.attributes as Record<string, string>)}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">{v.sku}</p>
                        </div>
                        <div className="text-right shrink-0 hidden sm:block">
                          <p className="text-xs text-gray-500">List price</p>
                          <p className="font-medium">{formatPaise(v.defaultPricePaise)}</p>
                        </div>
                        <div className="w-32 shrink-0">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="None"
                            value={draft[varKey] ?? ""}
                            onChange={(e) => setDiscount(varKey, e.target.value)}
                            className="w-full px-2 py-1.5 border border-emerald-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-300"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-10 text-center text-gray-500 text-sm">
            {viewScope === "custom" ? (
              <>
                <p className="font-medium text-gray-700">No discount rules yet</p>
                <p className="mt-1">Click &quot;Add More Discounts&quot; to set per-product discounts.</p>
              </>
            ) : (
              <p>No products match your search or filters.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
