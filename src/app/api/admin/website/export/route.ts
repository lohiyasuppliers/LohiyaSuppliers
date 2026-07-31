import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const sections = await prisma.pageSection.findMany({
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });

  const headers = [
    "Section Key",
    "Title",
    "Subtitle",
    "Status",
    "Sort Order",
    "Items Count",
    "Content Preview",
  ];
  const rows = sections.map((s) => {
    let itemCount = 0;
    try {
      const parsed = JSON.parse(s.content || "[]");
      itemCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      itemCount = 0;
    }
    const preview = (s.content || "").replace(/\s+/g, " ").trim().slice(0, 200);
    return [
      s.key,
      s.title,
      s.subtitle || "",
      s.isActive ? "Active" : "Inactive",
      s.sortOrder,
      itemCount,
      preview,
    ];
  });

  return csvDownloadResponse(buildCsv(headers, rows), "lohiya-website-sections.csv");
}
