import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPaise } from "@/lib/utils";
import { Plus } from "lucide-react";
import { ProductActions } from "@/components/admin/ProductActions";
import { CategoryType } from "@prisma/client";

export const metadata = { title: "Catalog" };
export const revalidate = 30;

interface Props {
  searchParams: Promise<{ search?: string; category?: string }>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const where: Record<string, unknown> = {};

  if (params.category) where.category = { slug: params.category };
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
      { hsnCode: { contains: params.search } },
    ];
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        _count: { select: { variations: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { parentId: { not: null } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
          <p className="text-gray-500 text-sm">
            {products.length} products & services
            {params.search ? ` matching "${params.search}"` : ""}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" /> Add Item
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/products"
          className={`px-3 py-1.5 rounded-lg text-sm ${!params.category ? "bg-brand-600 text-white" : "bg-white border text-gray-600"}`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/admin/products?category=${c.slug}`}
            className={`px-3 py-1.5 rounded-lg text-sm ${params.category === c.slug ? "bg-brand-600 text-white" : "bg-white border text-gray-600"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Brand</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">HSN</th>
              <th className="text-left px-4 py-3 font-medium">GST</th>
              <th className="text-left px-4 py-3 font-medium">Default Price</th>
              <th className="text-left px-4 py-3 font-medium">Variations</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-medium text-gray-900 hover:text-brand-700"
                  >
                    {product.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs font-medium">
                    {product.brand || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {product.category.name}
                  <span className="block text-xs text-gray-400">
                    {product.category.type === CategoryType.SERVICE ? "Service" : "Product"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{product.hsnCode}</td>
                <td className="px-4 py-3">{product.gstRateBps / 100}%</td>
                <td className="px-4 py-3 font-medium">{formatPaise(product.defaultPricePaise)}</td>
                <td className="px-4 py-3">{product._count.variations}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ProductActions productId={product.id} slug={product.slug} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
