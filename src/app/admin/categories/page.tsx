import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, ChevronRight } from "lucide-react";
import { CategoryActions } from "@/components/admin/CategoryActions";
import { APPLICATION_LABELS } from "@/lib/catalog";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true, children: true } },
      parent: { select: { name: true } },
      children: {
        include: { _count: { select: { products: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  });

  const departments = categories.filter((c) => !c.parentId);
  const subcategories = categories.filter((c) => c.parentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Hierarchy</h1>
          <p className="text-gray-500 text-sm">
            {departments.length} departments · {subcategories.length} subcategories
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" /> Add Category
        </Link>
      </div>

      <div className="space-y-8">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-start gap-4 p-6 bg-brand-50/50 border-b">
              <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden relative shrink-0">
                {dept.imageUrl && <OptimizedImage src={dept.imageUrl} alt="" sizes="80px" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-brand-600 uppercase">
                      {APPLICATION_LABELS[dept.application]} Department
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mt-1">{dept.name}</h2>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{dept.description}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/admin/categories/${dept.id}/edit`}
                      className="p-1.5 rounded hover:bg-white text-gray-500"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <CategoryActions
                      categoryId={dept.id}
                      productCount={dept._count.products}
                      childCount={dept._count.children}
                    />
                  </div>
                </div>
                <Link
                  href={`/categories/${dept.slug}`}
                  className="text-xs text-brand-600 hover:underline mt-2 inline-block"
                >
                  View on store →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {dept.children.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <ChevronRight className="w-4 h-4 text-gray-300 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900">{sub.name}</h3>
                      <div className="flex gap-1 shrink-0">
                        <Link
                          href={`/admin/categories/${sub.id}/edit`}
                          className="p-1 rounded hover:bg-gray-100 text-gray-500"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <CategoryActions
                          categoryId={sub.id}
                          productCount={sub._count.products}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{sub.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-gray-500">{sub._count.products} products</span>
                      <Link
                        href={`/categories/${sub.slug}`}
                        className="text-brand-600 hover:underline"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {dept.children.length === 0 && (
                <p className="text-sm text-gray-400 col-span-full">No subcategories yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
