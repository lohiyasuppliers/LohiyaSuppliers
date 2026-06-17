import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockAlert: number;
}

export function LowStockAlert({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="text-sm text-green-600 text-center py-4">✓ All products well stocked</p>;
  }

  return (
    <div className="space-y-2">
      {products.map((p) => (
        <div key={p.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
          <div>
            <div className="text-sm font-medium text-gray-900">{p.name}</div>
            <div className="text-xs text-gray-500">{p.sku}</div>
          </div>
          <span className="text-sm font-bold text-orange-600">{p.stock} left</span>
        </div>
      ))}
    </div>
  );
}
