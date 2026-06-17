import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const [category, parentOptions] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({
      where: { parentId: null, NOT: { id } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
      <CategoryForm initial={category} parentOptions={parentOptions} />
    </div>
  );
}
