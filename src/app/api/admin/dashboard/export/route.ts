import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { formatPaise } from "@/lib/utils";
import { Role } from "@prisma/client";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalProducts,
    totalVariations,
    totalOrders,
    totalClients,
    pendingApproval,
    paidRevenue,
    thisMonthRevenue,
    activeClients,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.productVariation.count(),
    prisma.order.count(),
    prisma.user.count({ where: { role: Role.CLIENT } }),
    prisma.order.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.order.aggregate({
      _sum: { totalPaise: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.order.aggregate({
      _sum: { totalPaise: true },
      where: { createdAt: { gte: thisMonthStart }, paymentStatus: "PAID" },
    }),
    prisma.user.count({ where: { role: Role.CLIENT, isActive: true } }),
  ]);

  const headers = ["Metric", "Value"];
  const rows = [
    ["Generated At", now.toISOString()],
    ["Total Products", totalProducts],
    ["Total Variations", totalVariations],
    ["Total Orders", totalOrders],
    ["B2B Clients", totalClients],
    ["Active Clients", activeClients],
    ["Pending Approval Orders", pendingApproval],
    ["Total Paid Revenue", formatPaise(paidRevenue._sum.totalPaise || 0)],
    ["This Month Revenue", formatPaise(thisMonthRevenue._sum.totalPaise || 0)],
  ];

  return csvDownloadResponse(buildCsv(headers, rows), "lohiya-dashboard-summary.csv");
}
