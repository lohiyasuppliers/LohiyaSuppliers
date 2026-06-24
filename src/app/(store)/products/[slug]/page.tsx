import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { productImagesFromJson } from "@/lib/catalog-images";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { ProductPurchasePanel } from "@/components/products/ProductPurchasePanel";
import { ProductFromPrice } from "@/components/products/ProductFromPrice";
import { ProductPricingProvider } from "@/context/ProductPricingContext";
import { getProductListFromPricePaise } from "@/lib/product-price";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ArrowLeft, Package, Shield, Layers } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { PricedProductGrid } from "@/components/products/PricedProductGrid";
import { variationCountLabel } from "@/lib/variations";
import { getCachedProductBySlug, getCachedRelatedProducts } from "@/lib/cache";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug }, select: { name: true } });
  return { title: product?.name || "Product" };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) notFound();

  const related = await getCachedRelatedProducts(
    product.id,
    product.categoryId,
    product.brand
  );

  const images = productImagesFromJson(product.images);
  const variationCount = product.variations.length;
  const variantLabel = variationCountLabel(variationCount);
  const listFromPricePaise = getProductListFromPricePaise(product, product.variations);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ScrollReveal>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        <ScrollReveal direction="left">
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-brand-50/40 rounded-2xl border border-gray-100 relative overflow-hidden shadow-xl shadow-brand-900/5">
            <OptimizedImage
              src={images[0]}
              alt={product.name}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="hover:scale-[1.02] transition-transform duration-700"
            />
            {product.brand && (
              <span className="absolute top-4 left-4 z-10 px-4 py-1.5 bg-white/95 backdrop-blur text-sm font-bold text-brand-800 rounded-xl shadow-md">
                {product.brand}
              </span>
            )}
            {variationCount > 0 && (
              <span className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-md flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                {variantLabel}
              </span>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right" delay={100}>
          <div>
            <Link
              href={`/categories/${product.category.slug}`}
              className="text-sm text-brand-600 font-medium hover:underline"
            >
              {product.category.parent
                ? `${product.category.parent.name} · ${product.category.name}`
                : product.category.name}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 leading-tight">
              {product.name}
            </h1>

            {variationCount > 0 && (
              <p className="mt-2 text-sm text-brand-700 font-medium flex items-center gap-1.5">
                <Package className="w-4 h-4 text-brand-500" />
                {variantLabel} — choose options below
              </p>
            )}

            <p className="text-gray-600 mt-4 leading-relaxed text-base">{product.description}</p>

            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
              <Shield className="w-4 h-4 shrink-0" />
              Genuine industrial grade · Authorized B2B partner
            </div>

            <ProductPricingProvider slug={product.slug} listFromPricePaise={listFromPricePaise}>
              <ProductFromPrice listFromPricePaise={listFromPricePaise} />

              <ProductPurchasePanel
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  defaultPricePaise: listFromPricePaise,
                  gstRateBps: product.gstRateBps,
                  images,
                }}
                variations={product.variations.map((v) => ({
                  id: v.id,
                  sku: v.sku,
                  attributes: v.attributes as Record<string, string>,
                  defaultPricePaise: v.defaultPricePaise,
                }))}
              />
            </ProductPricingProvider>
          </div>
        </ScrollReveal>
      </div>

      {related.length > 0 && (
        <section className="mt-16 pt-12 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Related Products</h2>
          <p className="text-sm text-gray-500 mb-8">
            More from {product.category.name}
            {product.brand ? ` and ${product.brand}` : ""}
          </p>
          <PricedProductGrid productIds={related.map((p) => p.id)}>
            <ProductGrid
              products={related}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            />
          </PricedProductGrid>
        </section>
      )}
    </div>
  );
}
