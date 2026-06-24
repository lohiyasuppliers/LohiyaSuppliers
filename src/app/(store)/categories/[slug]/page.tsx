import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { CatalogImage } from "@/components/ui/CatalogImage";
import { APPLICATION_LABELS } from "@/lib/catalog";
import { getCachedProductList } from "@/lib/cache";
import { categoryImageForSlug, normalizeImageUrl } from "@/lib/catalog-images";
import { ProductGrid } from "@/components/products/ProductGrid";
import { PricedProductGrid } from "@/components/products/PricedProductGrid";
import { CategoryType, ApplicationType } from "@prisma/client";
import { ArrowLeft, ArrowRight, Package } from "lucide-react";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug }, select: { name: true } });
  return { title: category?.name || "Category" };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug, isActive: true },
    include: {
      parent: true,
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: { where: { isActive: true } } } } },
      },
    },
  });

  if (!category) notFound();

  const isDepartment = !category.parentId;
  const products = isDepartment
    ? []
    : await getCachedProductList({ category: category.slug, sort: "name" });

  const categoryImage =
    normalizeImageUrl(category.imageUrl) || categoryImageForSlug(category.slug);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href={
          category.parent
            ? `/products?application=${category.application.toLowerCase()}`
            : "/products"
        }
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {category.parent ? category.parent.name : "All Products"}
      </Link>

      <ScrollReveal>
        <div className="relative overflow-hidden rounded-3xl mb-10 min-h-[220px] md:min-h-[280px]">
          <div className="absolute inset-0">
            <CatalogImage src={categoryImage} alt={category.name} sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-900/85 to-brand-800/70" />
          </div>
          <div className="relative text-white p-8 md:p-12">
            {category.parent && (
              <span className="text-sm font-medium uppercase text-brand-200">
                {APPLICATION_LABELS[category.application]}
              </span>
            )}
            {!category.parent && (
              <span className="text-sm font-medium uppercase text-brand-200">
                {category.application === ApplicationType.METAL ? "Metal Application" : "Wood Application"}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-bold mt-2 tracking-tight">{category.name}</h1>
            {category.description && (
              <p className="text-brand-100 mt-4 max-w-3xl leading-relaxed text-lg">{category.description}</p>
            )}
            <p className="text-brand-200 text-sm mt-4">
              {isDepartment
                ? `${category.children.length} subcategories`
                : `${products.length} products available`}
            </p>
          </div>
        </div>
      </ScrollReveal>

      {isDepartment ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.children.map((sub, i) => (
            <ScrollReveal key={sub.id} delay={i * 60}>
              <Link
                href={`/categories/${sub.slug}`}
                className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover"
              >
                <div className="aspect-[16/9] relative bg-gray-100 overflow-hidden">
                  {sub.imageUrl ? (
                    <CatalogImage
                      src={sub.imageUrl}
                      alt={sub.name}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">
                      <Package className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 group-hover:text-brand-700 transition-colors">
                    {sub.name}
                  </h3>
                  {sub.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{sub.description}</p>
                  )}
                  <p className="text-sm text-brand-600 font-medium mt-3 flex items-center gap-1">
                    {sub._count.products} products
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border">
          <p className="text-lg">No products in this category yet.</p>
        </div>
      ) : (
        <PricedProductGrid productIds={products.map((p) => p.id)}>
          <ProductGrid
            products={products}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          />
        </PricedProductGrid>
      )}
    </div>
  );
}
