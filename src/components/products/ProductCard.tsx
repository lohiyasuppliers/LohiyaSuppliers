import Link from "next/link";
import { firstProductImage } from "@/lib/catalog-images";
import { CatalogImage } from "@/components/ui/CatalogImage";
import { ProductCardPrice } from "@/components/products/ProductCardPrice";
import { getVariationCount, variationCountLabel } from "@/lib/variations";
import { CategoryType } from "@/lib/catalog-shared";
import { Layers } from "lucide-react";

function listFromPricePaise(product: ProductCardProps["product"]) {
  const variationPrices = (product.variations ?? [])
    .map((v) => v.defaultPricePaise)
    .filter((p): p is number => p != null && p > 0);
  if (variationPrices.length > 0) {
    return Math.min(...variationPrices);
  }
  return product.defaultPricePaise;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    brand?: string | null;
    description?: string;
    defaultPricePaise: number;
    images: string;
    category: {
      name: string;
      slug: string;
      type?: CategoryType;
      parent?: { name: string; slug: string } | null;
    };
    variations?: Array<{ id: string; defaultPricePaise?: number | null }>;
    _count?: { variations: number };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const imageSrc = firstProductImage(product.images);
  const variationCount = getVariationCount(product);
  const variantLabel = variationCountLabel(variationCount);
  const listPrice = listFromPricePaise(product);

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover motion-card-lift h-full flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="block relative aspect-square bg-gradient-to-br from-gray-50 to-brand-50/30 overflow-hidden"
      >
        <div className="relative w-full h-full">
          <CatalogImage
            src={imageSrc}
            alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        {product.brand && (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-bold text-brand-800 rounded-lg shadow-sm">
            {product.brand}
          </span>
        )}
        {variationCount > 0 && (
          <span className="absolute top-3 right-3 z-10 px-2 py-1 bg-brand-600/90 text-white text-xs font-medium rounded-lg">
            {variantLabel}
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link
          href={`/categories/${product.category.slug}`}
          className="text-xs text-brand-600 font-medium hover:underline"
        >
          {product.category.parent
            ? `${product.category.parent.name} · ${product.category.name}`
            : product.category.name}
        </Link>
        <Link href={`/products/${product.slug}`} className="flex-1">
          <h3 className="font-semibold text-gray-900 mt-1 group-hover:text-brand-700 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        {variationCount > 0 && (
          <p className="text-xs text-brand-700 font-medium mt-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            {variantLabel}
          </p>
        )}
        {product.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
        )}
        <ProductCardPrice productId={product.id} defaultPricePaise={listPrice} />
      </div>
    </div>
  );
}
