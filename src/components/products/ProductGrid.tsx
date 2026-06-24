import { ProductCard } from "@/components/products/ProductCard";
import { CategoryType } from "@/lib/catalog-shared";
import { cn } from "@/lib/utils";

export interface ProductGridItem {
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
}

export function ProductGrid({
  products,
  className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
}: {
  products: ProductGridItem[];
  className?: string;
}) {
  return (
    <div className={cn(className, "product-grid-stagger")}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
