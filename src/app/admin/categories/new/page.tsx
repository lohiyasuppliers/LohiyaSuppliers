import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata = { title: "Add Category" };

interface Props {
  searchParams: Promise<{ parentId?: string }>;
}

export default async function NewCategoryPage({ searchParams }: Props) {
  const { parentId } = await searchParams;
  const parentOptions = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, application: true },
  });

  const parent = parentId
    ? parentOptions.find((p) => p.id === parentId)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {parent ? `Add Subcategory to ${parent.name}` : "Add Category"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {parent
            ? "Subcategories appear in the catalog dropdown and product filters."
            : "Top-level departments (Metal / Wood) group subcategories."}
        </p>
      </div>
      <CategoryForm parentOptions={parentOptions} defaultParentId={parentId} />
    </div>
  );
}
