"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApplicationType, APPLICATION_LABELS } from "@/lib/catalog-shared";
import { ChevronDown, Filter, X } from "lucide-react";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  application?: ApplicationType;
  parentId?: string | null;
}

interface CatalogTree {
  id: string;
  name: string;
  slug: string;
  application: ApplicationType;
  subcategories: { id: string; name: string; slug: string; productCount: number }[];
}

interface ProductFiltersProps {
  catalogTree: CatalogTree[];
  leafCategories: CategoryNode[];
  currentApplication?: string;
  currentCategory?: string;
  currentBrand?: string;
  currentSort?: string;
  brands: string[];
}

export function ProductFilters({
  catalogTree,
  leafCategories,
  currentApplication,
  currentCategory,
  currentBrand,
  currentSort,
  brands,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
    setMobileOpen(false);
  }


  const activeCount = [currentApplication, currentCategory, currentBrand, searchParams.get("search")]
    .filter(Boolean).length;

  const panel = (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-semibold text-gray-900 mb-3 block">Application</label>
        <div className="space-y-1">
          {[
            { value: "", label: "All Products", href: "/products" },
            { value: "metal", label: "Metal Application", icon: "⚙️" },
            { value: "wood", label: "Wood Application", icon: "🪵" },
          ].map((app) => (
            <button
              key={app.value}
              onClick={() =>
                updateFilters({ application: app.value, category: "" })
              }
              className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-xl transition-all ${
                (currentApplication || "") === app.value
                  ? "bg-brand-600 text-white font-medium shadow-md shadow-brand-600/20"
                  : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              {"icon" in app && <span>{app.icon}</span>}
              {app.label}
            </button>
          ))}
        </div>
      </div>

      {catalogTree.map((dept) => {
        if (currentApplication && dept.application.toLowerCase() !== currentApplication) return null;
        return (
          <div key={dept.id}>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">
              {APPLICATION_LABELS[dept.application]}
            </label>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {dept.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => updateFilters({ category: sub.slug, application: dept.application.toLowerCase() })}
                  className={`flex items-center justify-between w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    currentCategory === sub.slug
                      ? "bg-brand-50 text-brand-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className="text-xs text-gray-400">{sub.productCount}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {brands.length > 0 && (
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Brand</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateFilters({ brand: "" })}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                !currentBrand ? "bg-brand-600 text-white border-brand-600" : "border-gray-200 text-gray-600 hover:border-brand-300"
              }`}
            >
              All
            </button>
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => updateFilters({ brand })}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  currentBrand === brand
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-gray-200 text-gray-600 hover:border-brand-300"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-gray-900 mb-2 block">Search</label>
        <input
          type="search"
          placeholder="Search products..."
          defaultValue={searchParams.get("search") || ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilters({ search: (e.target as HTMLInputElement).value });
            }
          }}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-900 mb-2 block">Sort By</label>
        <select
          value={currentSort || ""}
          onChange={(e) => updateFilters({ sort: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {activeCount > 0 && (
        <button
          onClick={() => router.push("/products")}
          className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50"
        >
          <X className="w-4 h-4" /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-medium mb-4"
      >
        <Filter className="w-4 h-4" />
        Filters {activeCount > 0 && `(${activeCount})`}
        <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
      </button>

      <aside className={`lg:w-72 shrink-0 ${mobileOpen ? "block" : "hidden lg:block"}`}>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-600" />
            Browse Catalog
          </h3>
          {panel}
        </div>
      </aside>
    </>
  );
}
