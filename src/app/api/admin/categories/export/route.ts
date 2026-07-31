import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const categories = await prisma.category.findMany({
    include: {
      parent: { select: { name: true } },
      _count: { select: { products: true, children: true } },
    },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const headers = [
    "ID",
    "Name",
    "Slug",
    "Type",
    "Application",
    "Parent",
    "Products",
    "Subcategories",
    "Active",
    "Sort Order",
  ];

  const rows = categories.map((c) => [
    c.id,
    c.name,
    c.slug,
    c.type,
    c.application,
    c.parent?.name || "",
    c._count.products,
    c._count.children,
    c.isActive ? "Yes" : "No",
    c.sortOrder,
  ]);

  return csvDownloadResponse(buildCsv(headers, rows), "lohiya-categories.csv");
}
