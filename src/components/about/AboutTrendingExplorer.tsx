"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useInView } from "@/hooks/useInView";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import { CatalogImage } from "@/components/ui/CatalogImage";
import { firstProductImage } from "@/lib/catalog-images";
import { formatPaise } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Flame,
  Wrench,
  TreePine,
  Cog,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Package,
  SlidersHorizontal,
} from "lucide-react";

export type AboutTrendingProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  defaultPricePaise: number;
  images: string;
  sortOrder: number;
  category: {
    name: string;
    slug: string;
    type: string;
    application: string | null;
  };
};

type FilterId =
  | "all"
  | "trending"
  | "metal"
  | "wood"
  | "tools"
  | "services"
  | "deerfros"
  | "aipl";

type SortId = "trending" | "price-asc" | "price-desc" | "name";

const FILTERS: { id: FilterId; label: string; icon: typeof Flame }[] = [
  { id: "all", label: "All", icon: Package },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "metal", label: "Metal", icon: Cog },
  { id: "wood", label: "Wood", icon: TreePine },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "services", label: "Services", icon: Sparkles },
  { id: "deerfros", label: "Deerfros", icon: TrendingUp },
  { id: "aipl", label: "AIPL", icon: TrendingUp },
];

const SORTS: { id: SortId; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "price-asc", label: "Price ↑" },
  { id: "price-desc", label: "Price ↓" },
  { id: "name", label: "A–Z" },
];

function matchesFilter(p: AboutTrendingProduct, filter: FilterId): boolean {
  switch (filter) {
    case "all":
      return true;
    case "trending":
      return p.sortOrder <= 12;
    case "metal":
      return p.category.application === "METAL" || p.category.application === "BOTH";
    case "wood":
      return p.category.application === "WOOD" || p.category.application === "BOTH";
    case "tools":
      return p.category.slug === "tools-hardware" || p.category.slug === "abrasives";
    case "services":
      return p.category.type === "SERVICE";
    case "deerfros":
      return (p.brand ?? "").toLowerCase().includes("deerfros");
    case "aipl":
      return (p.brand ?? "").toLowerCase().includes("aipl");
    default:
      return true;
  }
}

function sortProducts(list: AboutTrendingProduct[], sort: SortId) {
  const copy = [...list];
  if (sort === "price-asc") copy.sort((a, b) => a.defaultPricePaise - b.defaultPricePaise);
  else if (sort === "price-desc") copy.sort((a, b) => b.defaultPricePaise - a.defaultPricePaise);
  else if (sort === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
  else copy.sort((a, b) => a.sortOrder - b.sortOrder);
  return copy;
}

export function AboutTrendingExplorer({ products }: { products: AboutTrendingProduct[] }) {
  const { ref, inView } = useInView();
  const [filter, setFilter] = useState<FilterId>("trending");
  const [sort, setSort] = useState<SortId>("trending");

  const filtered = useMemo(() => {
    const matched = products.filter((p) => matchesFilter(p, filter));
    return sortProducts(matched, sort).slice(0, 8);
  }, [products, filter, sort]);

  const catalogHref = useMemo(() => {
    const params = new URLSearchParams();
    if (filter === "metal") params.set("application", "metal");
    if (filter === "wood") params.set("application", "wood");
    if (filter === "deerfros" || filter === "aipl") params.set("brand", filter === "deerfros" ? "Deerfros" : "AIPL");
    if (sort !== "trending") params.set("sort", sort === "name" ? "name" : sort);
    const q = params.toString();
    return q ? `/products?${q}` : "/products";
  }, [filter, sort]);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden bg-gradient-to-b from-white via-brand-50/30 to-white">
      <div className="absolute top-20 -left-32 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-[420px] h-[420px] bg-accent-200/25 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4">
        <AboutSectionHeader
          eyebrow="Explore catalog"
          title={
            <>
              Trending picks &{" "}
              <span className="text-gradient">smart filters</span>
            </>
          }
          subtitle="Browse what industrial buyers are ordering most — filter by industry, brand, or application."
          inView={inView}
        />

        <div
          className={cn(
            "flex flex-col gap-4 mb-8 transition-all duration-700",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter by
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f, i) => {
              const active = filter === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "about-filter-chip inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-all duration-300",
                    active
                      ? "bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-600/25 scale-[1.02]"
                      : "bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:text-brand-700 hover:shadow-md"
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <Icon className={cn("w-4 h-4", active && "animate-pulse")} />
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sort</span>
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSort(s.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
                  sort === s.id
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-white"
                )}
              >
                {s.label}
              </button>
            ))}
            <span className="text-sm text-gray-500 ml-auto">
              Showing <strong className="text-gray-900">{filtered.length}</strong> of {products.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((product, i) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className={cn(
                "group about-trending-card relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${120 + i * 70}ms` }}
            >
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-brand-50/40">
                <CatalogImage
                  src={firstProductImage(product.images)}
                  alt={product.name}
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {filter === "trending" && i < 3 && (
                  <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wide animate-bounce-in">
                    Hot
                  </span>
                )}
                {product.brand && (
                  <span className="absolute top-3 right-3 z-10 px-2 py-1 rounded-lg bg-white/90 backdrop-blur text-[10px] font-bold text-brand-800">
                    {product.brand}
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 mb-1">
                  {product.category.name}
                </p>
                <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
                  {product.name}
                </h3>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span className="font-bold text-brand-800">{formatPaise(product.defaultPricePaise)}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500 animate-fade-in">
            No products match this filter. Try another category.
          </div>
        )}

        <div
          className={cn(
            "mt-12 flex justify-center transition-all duration-700 delay-300",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <Link
            href={catalogHref}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-600 text-white font-semibold shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            View full catalog
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
