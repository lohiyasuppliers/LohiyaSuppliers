import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { productImagesFromJson } from "@/lib/catalog-images";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductPurchasePanel } from "@/components/products/ProductPurchasePanel";
import { ProductFromPrice } from "@/components/products/ProductFromPrice";
import { ProductPricingProvider } from "@/context/ProductPricingContext";
import { getProductListFromPricePaise } from "@/lib/product-price";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ArrowLeft, Package, Shield } from "lucide-react";
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
          <ProductImageGallery
            images={images}
            productName={product.name}
            brand={product.brand}
            variantBadge={variationCount > 0 ? variantLabel : undefined}
          />
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
