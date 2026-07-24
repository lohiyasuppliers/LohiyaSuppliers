import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { formatPaise } from "@/lib/utils";
import { PaymentStatus, Role } from "@prisma/client";

const ALLOWED_DAYS = new Set([30, 90, 365]);

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const daysParam = Number(new URL(req.url).searchParams.get("days"));
  const days = ALLOWED_DAYS.has(daysParam) ? daysParam : 90;
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  const dateFilter = { createdAt: { gte: since } };

  const [orders, products, clients, paymentGroups, topItems] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: PaymentStatus.PAID, ...dateFilter },
      select: { totalPaise: true, createdAt: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: Role.CLIENT, isActive: true } }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      where: dateFilter,
      _count: true,
    }),
    prisma.orderItem.findMany({
      where: { order: { paymentStatus: PaymentStatus.PAID, ...dateFilter } },
      select: { productId: true, productName: true, quantity: true, totalPaise: true },
    }),
  ]);

  const totalRevenuePaise = orders.reduce((sum, o) => sum + o.totalPaise, 0);
  const avgOrderPaise =
    orders.length > 0 ? Math.round(totalRevenuePaise / orders.length) : 0;

  const monthlyRevenue: Record<string, number> = {};
  orders.forEach((o) => {
    const month = new Date(o.createdAt).toLocaleString("en", {
      month: "short",
      year: "2-digit",
    });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + o.totalPaise / 100;
  });

  const productAgg = new Map<
    string,
    { name: string; quantity: number; revenuePaise: number }
  >();
  for (const item of topItems) {
    const existing = productAgg.get(item.productId) || {
      name: item.productName,
      quantity: 0,
      revenuePaise: 0,
    };
    existing.quantity += item.quantity;
    existing.revenuePaise += item.totalPaise;
    productAgg.set(item.productId, existing);
  }
  const topProductDetails = [...productAgg.values()]
    .sort((a, b) => b.revenuePaise - a.revenuePaise)
    .slice(0, 10);
  const topRevenueTotal = topProductDetails.reduce((s, p) => s + p.revenuePaise, 0);

  const rows: string[][] = [
    ["Metric", "Value"],
    ["Date Range (days)", String(days)],
    ["Total Revenue", formatPaise(totalRevenuePaise)],
    ["Paid Orders", String(orders.length)],
    ["Avg Order Value", formatPaise(avgOrderPaise)],
    ["Active Products", String(products)],
    ["Active B2B Clients", String(clients)],
    [""],
    ["Payment Status", "Count"],
    ...paymentGroups.map((g) => [g.paymentStatus, String(g._count)]),
    [""],
    ["Month", "Revenue (INR)"],
    ...Object.entries(monthlyRevenue).map(([month, revenue]) => [
      month,
      revenue.toFixed(2),
    ]),
    [""],
    ["Top Products", "Qty Sold", "Revenue", "Revenue %"],
    ...topProductDetails.map((p) => [
      p.name,
      String(p.quantity),
      formatPaise(p.revenuePaise),
      topRevenueTotal > 0
        ? `${((p.revenuePaise / topRevenueTotal) * 100).toFixed(1)}%`
        : "0%",
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="lohiya-analytics-${days}d-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
