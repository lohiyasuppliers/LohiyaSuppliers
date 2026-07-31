import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";
import { AdminProductFilters } from "@/components/admin/AdminProductFilters";
import { CatalogProductTable } from "@/components/admin/CatalogProductTable";
import { Suspense } from "react";

export const metadata = { title: "Catalog" };
export const revalidate = 30;

interface Props {
  searchParams: Promise<{
    search?: string;
    category?: string;
    brand?: string;
    status?: string;
    variants?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const where: Record<string, unknown> = {};
  const and: Record<string, unknown>[] = [];

  if (params.category) {
    and.push({ category: { slug: params.category } });
  }

  if (params.brand) {
    and.push({ brand: params.brand });
  }

  if (params.status === "active") {
    and.push({ isActive: true });
  } else if (params.status === "inactive") {
    and.push({ isActive: false });
  }

  if (params.variants === "with") {
    and.push({ variations: { some: {} } });
  } else if (params.variants === "without") {
    and.push({ variations: { none: {} } });
  }

  if (params.search?.trim()) {
    const q = params.search.trim();
    and.push({
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
        { brand: { contains: q } },
        { slug: { contains: q } },
        { variations: { some: { sku: { contains: q } } } },
        { variations: { some: { label: { contains: q } } } },
      ],
    });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  const [products, categories, brandRows] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        variations: {
          orderBy: { sku: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { parentId: { not: null } },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { brand: { not: null } },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
  ]);

  const brands = brandRows
    .map((r) => r.brand)
    .filter((b): b is string => Boolean(b?.trim()))
    .sort((a, b) => a.localeCompare(b));

  const catalogProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    defaultPricePaise: p.defaultPricePaise,
    purchasePricePaise: p.purchasePricePaise,
    purchasePriceDate: p.purchasePriceDate,
    gstRateBps: p.gstRateBps,
    isActive: p.isActive,
    category: { name: p.category.name, type: p.category.type },
    variations: p.variations.map((v) => ({
      id: v.id,
      sku: v.sku,
      label: v.label,
      attributes: v.attributes as Record<string, string>,
      defaultPricePaise: v.defaultPricePaise,
      purchasePricePaise: v.purchasePricePaise,
      purchasePriceDate: v.purchasePriceDate,
      imageUrl: v.imageUrl,
      isActive: v.isActive,
    })),
  }));

  const filterSummary = [
    params.search && `"${params.search}"`,
    params.category && `category: ${params.category}`,
    params.brand && `brand: ${params.brand}`,
    params.status && params.status,
    params.variants && `variants: ${params.variants}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6 admin-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
          <p className="text-gray-500 text-sm">
            {products.length} products &amp; services
            {filterSummary ? ` · ${filterSummary}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CsvDownloadButton
            href="/api/admin/products/export"
            label="Download Catalog (CSV)"
            className="inline-flex items-center gap-2 px-4 py-2 border border-brand-200 bg-white text-brand-700 rounded-lg text-sm font-medium hover:bg-brand-50"
          />
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" /> Add Item
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="bg-white rounded-xl border p-4 h-24 text-sm text-gray-400">
            Loading filters…
          </div>
        }
      >
        <AdminProductFilters categories={categories} brands={brands} />
      </Suspense>

      <CatalogProductTable products={catalogProducts} />
    </div>
  );
}
