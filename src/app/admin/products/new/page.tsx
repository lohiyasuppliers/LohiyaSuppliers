import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Add Product" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { parent: { select: { name: true } } },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
