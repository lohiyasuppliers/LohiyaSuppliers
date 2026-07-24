import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { formatPaise } from "@/lib/utils";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: { select: { name: true, slug: true, parent: { select: { name: true } } } },
      _count: { select: { variations: true } },
    },
    orderBy: { name: "asc" },
  });

  const headers = [
    "ID",
    "Name",
    "Slug",
    "Brand",
    "Category",
    "Parent Category",
    "HSN",
    "Default Price",
    "GST %",
    "Variations",
    "Active",
  ];

  const rows = products.map((p) => [
    p.id,
    p.name,
    p.slug,
    p.brand || "",
    p.category.name,
    p.category.parent?.name || "",
    p.hsnCode || "",
    formatPaise(p.defaultPricePaise).replace("₹", ""),
    ((p.gstRateBps || 0) / 100).toFixed(2),
    String(p._count.variations),
    p.isActive ? "Yes" : "No",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="lohiya-products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
