import Link from "next/link";
import { formatPaise } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  defaultPricePaise: number;
  category: { name: string };
  _count?: { variations: number };
}

export function CatalogOverview({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">No products in catalog</p>;
  }

  return (
    <div className="space-y-2">
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/admin/products/${p.slug}/edit`}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm"
        >
          <div>
            <div className="font-medium text-gray-900">{p.name}</div>
            <div className="text-xs text-gray-500">{p.category.name}</div>
          </div>
          <div className="text-right">
            <div className="font-medium">{formatPaise(p.defaultPricePaise)}</div>
            {p._count && (
              <div className="text-xs text-gray-400">{p._count.variations} variations</div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
