import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { formatPaise } from "@/lib/utils";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const products = await prisma.product.findMany({
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
    "Purchase Price",
    "Purchase Date",
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
    p.purchasePricePaise != null ? formatPaise(p.purchasePricePaise).replace("₹", "") : "",
    p.purchasePriceDate
      ? new Date(p.purchasePriceDate).toLocaleDateString("en-IN")
      : "",
    ((p.gstRateBps || 0) / 100).toFixed(2),
    String(p._count.variations),
    p.isActive ? "Yes" : "No",
  ]);

  return csvDownloadResponse(
    buildCsv(headers, rows),
    `lohiya-catalog-${new Date().toISOString().slice(0, 10)}.csv`
  );
}
