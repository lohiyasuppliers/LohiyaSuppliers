import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const headers = [
    "Banner No",
    "Title",
    "Subtitle",
    "Image URL",
    "Link URL",
    "Sort Order",
    "Status",
    "Created Date",
  ];
  const rows = banners.map((b, idx) => [
    `BNR-${String(idx + 1).padStart(3, "0")}`,
    b.title,
    b.subtitle || "",
    b.imageUrl,
    b.linkUrl || "",
    b.sortOrder,
    b.isActive ? "Active" : "Inactive",
    new Date(b.createdAt).toISOString().slice(0, 10),
  ]);

  return csvDownloadResponse(buildCsv(headers, rows), "lohiya-banners.csv");
}
