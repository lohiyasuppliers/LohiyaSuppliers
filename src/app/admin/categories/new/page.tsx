import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata = { title: "Add Category" };

export default async function NewCategoryPage() {
  const parentOptions = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add Category</h1>
      <CategoryForm parentOptions={parentOptions} />
    </div>
  );
}
