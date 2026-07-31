import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { formatPaise } from "@/lib/utils";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const vouchers = await prisma.clientVoucher.findMany({
    include: {
      client: {
        select: {
          name: true,
          email: true,
          clientProfile: { select: { company: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "ID",
    "Code",
    "Client",
    "Email",
    "Company",
    "Type",
    "Value",
    "Scope",
    "Min Order",
    "Used",
    "Max Uses",
    "Active",
    "Expires",
  ];

  const rows = vouchers.map((v) => [
    v.id,
    v.code,
    v.client.name || "",
    v.client.email,
    v.client.clientProfile?.company || "",
    v.type,
    v.type === "FIXED" ? formatPaise(v.valuePaise || 0).replace("₹", "") : `${(v.valueBps || 0) / 100}%`,
    v.scope,
    v.minOrderPaise > 0 ? formatPaise(v.minOrderPaise).replace("₹", "") : "",
    v.usedCount,
    v.maxUses ?? "",
    v.isActive ? "Yes" : "No",
    v.expiresAt ? new Date(v.expiresAt).toISOString() : "",
  ]);

  return csvDownloadResponse(buildCsv(headers, rows), "lohiya-coupons.csv");
}
