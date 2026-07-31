import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const headers = ["ID", "Title", "Subtitle", "Image URL", "Link URL", "Sort Order", "Active", "Created"];
  const rows = banners.map((b) => [
    b.id,
    b.title,
    b.subtitle || "",
    b.imageUrl,
    b.linkUrl || "",
    b.sortOrder,
    b.isActive ? "Yes" : "No",
    new Date(b.createdAt).toISOString(),
  ]);

  return csvDownloadResponse(buildCsv(headers, rows), "lohiya-banners.csv");
}
