"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IndianRupee,
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
  customPricePaise: number | null;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string;
  defaultPricePaise: number;
  customProductPricePaise: number | null;
  variations: VariationRow[];
  hasCustom?: boolean;
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
    if (p.customProductPricePaise != null) {
      initial[pk] = paiseToRupees(p.customProductPricePaise);
    }
    for (const v of p.variations) {
      const vk = `${p.id}:${v.id}`;
      if (v.customPricePaise != null) initial[vk] = paiseToRupees(v.customPricePaise);
    }
  }
  return initial;
}

export function ClientPricingManager({ clientId }: { clientId: string }) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savedDraft, setSavedDraft] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [overrideCount, setOverrideCount] = useState(0);
  const [viewScope, setViewScope] = useState<ViewScope>("custom");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPricing = useCallback(
    async (scope: ViewScope) => {
      setLoading(true);
      const res = await fetch(`/api/admin/users/${clientId}/pricing?scope=${scope}`);
      const data = await res.json();
      const rows: ProductRow[] = data.products || [];
      setProducts(rows);
      setBrands(data.brands || []);
      setCategories(data.categories || []);
      setOverrideCount(data.overrideCount ?? 0);
      const initial = draftFromProducts(rows);
      setDraft(initial);
      setSavedDraft(initial);
      setExpanded(new Set(rows.map((p) => p.id)));
      setLoading(false);
    },
    [clientId]
  );

  useEffect(() => {
    loadPricing(viewScope);
  }, [loadPricing, viewScope]);

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

  function setPrice(key: string, value: string) {
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
    const overrides: { productId: string; variationId: string; priceRupees: string | null }[] =
      [];

    for (const key of keys) {
      const [productId, variationId] = key.split(":");
      if (!productId || !variationId) continue;
      const value = draft[key]?.trim() ?? "";
      const hadSaved = savedDraft[key]?.trim();
      if (value) {
        overrides.push({ productId, variationId, priceRupees: draft[key] });
      } else if (hadSaved) {
        overrides.push({ productId, variationId, priceRupees: null });
      }
    }

    const res = await fetch(`/api/admin/users/${clientId}/pricing`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overrides }),
    });

    if (res.ok) {
      const data = await res.json();
      alert(`Pricing saved! ${data.overrideCount} custom price(s) active.`);
      await loadPricing(viewScope);
    } else {
      alert((await res.json()).error || "Failed to save pricing");
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="bg-white rounded-xl border p-8 h-48 animate-pulse" />;
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="p-5 border-b bg-brand-50/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-brand-600" />
            B2B Custom Pricing
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {viewScope === "custom"
              ? `Showing ${overrideCount} edited price(s) only. Use search & filters, or add pricing for more products.`
              : "Browse the full catalog to set client-specific product or variant prices."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {viewScope === "custom" ? (
            <button
              type="button"
              onClick={() => setViewScope("all")}
              className="inline-flex items-center gap-2 px-4 py-2 border border-brand-200 text-brand-700 rounded-lg text-sm font-medium hover:bg-brand-50"
            >
              <Plus className="w-4 h-4" />
              Add More Pricing
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setViewScope("custom")}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Show Edited Only
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
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
        <div className="flex flex-wrap gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              viewScope === "custom"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {viewScope === "custom" ? "Edited prices only" : "Full catalog"}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-100 text-brand-800 font-medium">
            {filtered.length} product{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="max-h-[32rem] overflow-y-auto divide-y">
        {filtered.map((p) => {
          const isOpen = expanded.has(p.id);
          const productKey = `${p.id}:${PRODUCT_LEVEL_VARIATION_ID}`;
          const productHasCustom = !!draft[productKey]?.trim() || p.customProductPricePaise != null;

          const visibleVariations =
            viewScope === "custom"
              ? p.variations.filter(
                  (v) =>
                    draft[`${p.id}:${v.id}`]?.trim() || v.customPricePaise != null
                )
              : p.variations;

          const showProductRow =
            viewScope === "all" || productHasCustom || visibleVariations.length > 0;

          if (!showProductRow) return null;

          return (
            <div key={p.id} className="bg-white">
              <div className="flex items-center gap-3 p-4 hover:bg-gray-50/80">
                {visibleVariations.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(p.id)}
                    className="p-1 rounded hover:bg-gray-100"
                    aria-label={isOpen ? "Collapse variants" : "Expand variants"}
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
                    {viewScope === "all" && ` · ${p.variations.length} variants`}
                    {viewScope === "custom" && visibleVariations.length > 0 && (
                      <span> · {visibleVariations.length} edited variant(s)</span>
                    )}
                    {productHasCustom && (
                      <span className="ml-2 text-emerald-600 font-medium">Product price set</span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">Catalog</p>
                  <p className="text-sm font-medium">{formatPaise(p.defaultPricePaise)}</p>
                </div>
                {(viewScope === "all" || productHasCustom) && (
                  <div className="w-28 shrink-0">
                    <label className="text-xs text-gray-500 block mb-0.5">Client ₹</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Default"
                      value={draft[productKey] ?? ""}
                      onChange={(e) => setPrice(productKey, e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>

              {isOpen && visibleVariations.length > 0 && (
                <div className="px-4 pb-4 pl-12 space-y-2">
                  {visibleVariations.map((v) => {
                    const varKey = `${p.id}:${v.id}`;
                    const variantHasCustom =
                      !!draft[varKey]?.trim() || v.customPricePaise != null;
                    return (
                      <div
                        key={v.id}
                        className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                          variantHasCustom ? "bg-emerald-50/80 border border-emerald-100" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 capitalize">
                            {variationLabel(v.attributes as Record<string, string>)}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">{v.sku}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500">Catalog</p>
                          <p className="font-medium">{formatPaise(v.defaultPricePaise)}</p>
                          {variantHasCustom && draft[varKey]?.trim() && (
                            <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                              → {formatPaise(Math.round(Number(draft[varKey]) * 100))}
                            </p>
                          )}
                        </div>
                        <div className="w-28 shrink-0">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Default"
                            value={draft[varKey] ?? ""}
                            onChange={(e) => setPrice(varKey, e.target.value)}
                            className="w-full px-2 py-1.5 border rounded-lg text-sm bg-white"
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
                <p className="font-medium text-gray-700">No custom prices yet</p>
                <p className="mt-1">Click &quot;Add More Pricing&quot; to set client rates.</p>
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
