import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { fetchDistinctProductBrands } from "@/lib/brands";

export const metadata = { title: "Add Product" };

export default async function NewProductPage() {
  const [categories, brandOptions] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { parent: { select: { name: true } } },
    }),
    fetchDistinctProductBrands(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
      <ProductForm categories={categories} brandOptions={brandOptions} />
    </div>
  );
}
