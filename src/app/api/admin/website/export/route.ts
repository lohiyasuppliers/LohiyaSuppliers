import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const sections = await prisma.pageSection.findMany({
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });

  const headers = ["ID", "Key", "Title", "Subtitle", "Active", "Sort Order", "Items Count", "Content"];
  const rows = sections.map((s) => {
    let itemCount = 0;
    try {
      const parsed = JSON.parse(s.content || "[]");
      itemCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      itemCount = 0;
    }
    return [
      s.id,
      s.key,
      s.title,
      s.subtitle || "",
      s.isActive ? "Yes" : "No",
      s.sortOrder,
      itemCount,
      s.content,
    ];
  });

  return csvDownloadResponse(buildCsv(headers, rows), "lohiya-website-sections.csv");
}
