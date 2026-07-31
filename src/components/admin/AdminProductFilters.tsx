"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export function AdminProductFilters({
  categories,
  brands,
}: {
  categories: CategoryOption[];
  brands: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [brand, setBrand] = useState(searchParams.get("brand") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [variants, setVariants] = useState(searchParams.get("variants") || "");

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setCategory(searchParams.get("category") || "");
    setBrand(searchParams.get("brand") || "");
    setStatus(searchParams.get("status") || "");
    setVariants(searchParams.get("variants") || "");
  }, [searchParams]);

  function buildParams(overrides?: Partial<{
    search: string;
    category: string;
    brand: string;
    status: string;
    variants: string;
  }>) {
    const params = new URLSearchParams();
    const s = overrides?.search ?? search;
    const c = overrides?.category ?? category;
    const b = overrides?.brand ?? brand;
    const st = overrides?.status ?? status;
    const v = overrides?.variants ?? variants;

    if (s.trim()) params.set("search", s.trim());
    if (c) params.set("category", c);
    if (b) params.set("brand", b);
    if (st) params.set("status", st);
    if (v) params.set("variants", v);

    return params;
  }

  function applyFilters(overrides?: Partial<{
    search: string;
    category: string;
    brand: string;
    status: string;
    variants: string;
  }>) {
    const params = buildParams(overrides);
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  function clearFilters() {
    setSearch("");
    setCategory("");
    setBrand("");
    setStatus("");
    setVariants("");
    router.push(pathname);
  }

  const hasFilters =
    search.trim() || category || brand || status || variants;

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <SlidersHorizontal className="w-4 h-4 text-brand-600" />
        Search &amp; filters
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters();
        }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, brand, SKU, variant…"
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Search className="w-4 h-4" />
          Search
        </button>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            applyFilters({ category: e.target.value });
          }}
          className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[140px]"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select
          value={brand}
          onChange={(e) => {
            setBrand(e.target.value);
            applyFilters({ brand: e.target.value });
          }}
          className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[120px]"
          aria-label="Filter by brand"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            applyFilters({ status: e.target.value });
          }}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
          aria-label="Filter by status"
        >
          <option value="">All status</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>

        <select
          value={variants}
          onChange={(e) => {
            setVariants(e.target.value);
            applyFilters({ variants: e.target.value });
          }}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
          aria-label="Filter by variants"
        >
          <option value="">Any variants</option>
          <option value="with">With variants</option>
          <option value="without">No variants</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </form>
    </div>
  );
}
