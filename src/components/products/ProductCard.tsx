import Link from "next/link";
import { formatPaise, parseJSON } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { CategoryType } from "@prisma/client";

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
    variations?: { id: string }[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const images = parseJSON<string[]>(product.images, []);
  const isService = product.category.type === CategoryType.SERVICE;
  const variationCount = product.variations?.length ?? 0;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover h-full flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="block relative aspect-square bg-gradient-to-br from-gray-50 to-brand-50/30 overflow-hidden"
      >
        <div className="relative w-full h-full">
          {images[0] ? (
            <OptimizedImage
              src={images[0]}
              alt={product.name}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
              {isService ? "🔧" : "⚙️"}
            </div>
          )}
        </div>
        {product.brand && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-bold text-brand-800 rounded-lg shadow-sm">
            {product.brand}
          </span>
        )}
        {variationCount > 0 && (
          <span className="absolute top-3 right-3 px-2 py-1 bg-brand-600/90 text-white text-xs font-medium rounded-lg">
            {variationCount} variants
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
        {product.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-3 pt-3 border-t border-gray-50">
          <span className="text-lg font-bold text-brand-900">
            from {formatPaise(product.defaultPricePaise)}
          </span>
        </div>
      </div>
    </div>
  );
}
