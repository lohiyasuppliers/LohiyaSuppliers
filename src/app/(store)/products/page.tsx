import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  getCatalogTree,
  getLeafCategories,
  parseApplicationParam,
  productListSelect,
  APPLICATION_LABELS,
} from "@/lib/catalog";
import { ApplicationType } from "@prisma/client";
import { Suspense } from "react";
import Link from "next/link";
import { Wrench, TreePine } from "lucide-react";

export const metadata = { title: "All Products" };
export const revalidate = 60;

interface Props {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    application?: string;
    brand?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const application = parseApplicationParam(params.application);
  const where: Record<string, unknown> = { isActive: true };

  if (params.category) {
    where.category = { slug: params.category };
  } else if (application) {
    where.category = { application };
  }

  if (params.brand) {
    where.brand = params.brand;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
      { brand: { contains: params.search } },
    ];
  }

  let orderBy: Record<string, string> = { createdAt: "desc" };
  if (params.sort === "price-asc") orderBy = { defaultPricePaise: "asc" };
  if (params.sort === "price-desc") orderBy = { defaultPricePaise: "desc" };
  if (params.sort === "name") orderBy = { name: "asc" };

  const [products, catalogTree, leafCategories, brandRows] = await Promise.all([
    prisma.product.findMany({ where, select: productListSelect, orderBy }),
    getCatalogTree(),
    getLeafCategories(),
    prisma.product.findMany({
      where: { isActive: true, brand: { not: null } },
      select: { brand: true },
      distinct: ["brand"],
    }),
  ]);

  const brands = brandRows.map((b) => b.brand!).filter(Boolean).sort();
  const pageTitle = application
    ? APPLICATION_LABELS[application] + " Products"
    : "All Products";
  const PageIcon = application === ApplicationType.METAL
    ? Wrench
    : application === ApplicationType.WOOD
      ? TreePine
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white p-8 md:p-12 mb-10">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl animate-float" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              {PageIcon && <PageIcon className="w-8 h-8 text-brand-200" />}
              <span className="text-sm font-medium uppercase tracking-wider text-brand-200">
                B2B Catalog
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-brand-100 mt-3 max-w-2xl text-lg">
              Premium abrasives & tools from Deerfros, Leitz, and AIPL — with per-client custom pricing.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/products"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  !params.application ? "bg-white text-brand-900" : "bg-white/10 hover:bg-white/20"
                }`}
              >
                All Products
              </Link>
              <Link
                href="/products?application=metal"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  params.application === "metal" ? "bg-white text-brand-900" : "bg-white/10 hover:bg-white/20"
                }`}
              >
                ⚙️ Metal Application
              </Link>
              <Link
                href="/products?application=wood"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  params.application === "wood" ? "bg-white text-brand-900" : "bg-white/10 hover:bg-white/20"
                }`}
              >
                🪵 Wood Application
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div className="flex flex-col lg:flex-row gap-8">
        <Suspense
          fallback={
            <div className="lg:w-72 shrink-0 h-48 bg-white rounded-2xl border animate-pulse" />
          }
        >
          <ProductFilters
            catalogTree={catalogTree}
            leafCategories={leafCategories}
            currentApplication={params.application}
            currentCategory={params.category}
            currentBrand={params.brand}
            currentSort={params.sort}
            brands={brands}
          />
        </Suspense>
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-6">{products.length} products found</p>
          {products.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border">
              <p className="text-lg font-medium">No products found</p>
              <Link href="/products" className="text-brand-600 text-sm mt-2 inline-block hover:underline">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product, i) => (
                <ScrollReveal key={product.id} delay={Math.min(i * 50, 300)}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
