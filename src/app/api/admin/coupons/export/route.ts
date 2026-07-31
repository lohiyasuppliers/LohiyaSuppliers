import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { formatPaise } from "@/lib/utils";
import { clientCode } from "@/lib/export-format";

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
    "Voucher Code",
    "Client Code",
    "Client Name",
    "Email",
    "Company",
    "Discount Type",
    "Discount Value",
    "Scope",
    "Min Order (INR)",
    "Times Used",
    "Max Uses",
    "Status",
    "Expiry Date",
    "Created",
  ];

  const rows = vouchers.map((v, idx) => [
    v.code,
    clientCode(v.client.email, idx),
    v.client.name || "",
    v.client.email,
    v.client.clientProfile?.company || "",
    v.type,
    v.type === "FIXED" ? formatPaise(v.valuePaise || 0).replace("₹", "") : `${(v.valueBps || 0) / 100}%`,
    v.scope,
    v.minOrderPaise > 0 ? formatPaise(v.minOrderPaise).replace("₹", "") : "",
    v.usedCount,
    v.maxUses ?? "Unlimited",
    v.isActive ? "Active" : "Inactive",
    v.expiresAt ? new Date(v.expiresAt).toISOString().slice(0, 10) : "",
    new Date(v.createdAt).toISOString().slice(0, 10),
  ]);

  return csvDownloadResponse(buildCsv(headers, rows), "lohiya-coupons.csv");
}
