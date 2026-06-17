import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPaise, parseJSON } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { ProductPurchasePanel } from "@/components/products/ProductPurchasePanel";
import { ArrowLeft } from "lucide-react";
import { CategoryType } from "@prisma/client";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug }, select: { name: true } });
  return { title: product?.name || "Product" };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      variations: { where: { isActive: true }, orderBy: { sku: "asc" } },
    },
  });

  if (!product) notFound();

  const images = parseJSON<string[]>(product.images, []);
  const isService = product.category.type === CategoryType.SERVICE;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden">
          {images[0] ? (
            <OptimizedImage
              src={images[0]}
              alt={product.name}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">
              {isService ? "🔧" : "⚙️"}
            </div>
          )}
        </div>

        <div>
          <Link
            href={`/categories/${product.category.slug}`}
            className="text-sm text-brand-600 font-medium hover:underline"
          >
            {product.category.name}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>
          {product.brand && (
            <span className="inline-block mt-2 px-3 py-1 bg-brand-50 text-brand-700 text-sm font-semibold rounded-lg">
              {product.brand}
            </span>
          )}
          <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
            <p>
              <span className="text-gray-500">HSN:</span> {product.hsnCode}
            </p>
            <p>
              <span className="text-gray-500">GST:</span> {product.gstRateBps / 100}%
            </p>
            <p className="text-2xl font-bold text-brand-900 pt-2">
              from {formatPaise(product.defaultPricePaise)}
            </p>
          </div>

          <ProductPurchasePanel
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              defaultPricePaise: product.defaultPricePaise,
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
        </div>
      </div>
    </div>
  );
}
