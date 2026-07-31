import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { categoryCode } from "@/lib/export-format";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const categories = await prisma.category.findMany({
    include: {
      parent: { select: { name: true, slug: true } },
      _count: { select: { products: true, children: true } },
    },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const headers = [
    "Category Code",
    "Name",
    "Slug",
    "Type",
    "Application",
    "Parent Department",
    "Parent Code",
    "Product Count",
    "Subcategory Count",
    "Status",
    "Sort Order",
    "Description",
  ];

  const rows = categories.map((c) => [
    categoryCode(c.slug),
    c.name,
    c.slug,
    c.type,
    c.application,
    c.parent?.name || "",
    c.parent ? categoryCode(c.parent.slug) : "",
    c._count.products,
    c._count.children,
    c.isActive ? "Active" : "Inactive",
    c.sortOrder,
    (c.description || "").replace(/\s+/g, " ").trim(),
  ]);

  return csvDownloadResponse(
    buildCsv(headers, rows),
    `lohiya-categories-${new Date().toISOString().slice(0, 10)}.csv`
  );
}
