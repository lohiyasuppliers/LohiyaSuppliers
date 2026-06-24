import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { formatPaise } from "@/lib/utils";
import { Role } from "@prisma/client";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const [orders, products, clients, topProducts] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: "PAID" },
      select: { totalPaise: true, createdAt: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: Role.CLIENT, isActive: true } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
  ]);

  const totalRevenuePaise = orders.reduce((sum, o) => sum + o.totalPaise, 0);
  const avgOrderPaise = orders.length > 0 ? Math.round(totalRevenuePaise / orders.length) : 0;

  const monthlyRevenue: Record<string, number> = {};
  orders.forEach((o) => {
    const month = new Date(o.createdAt).toLocaleString("en", { month: "short", year: "2-digit" });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + o.totalPaise / 100;
  });

  const topProductDetails = await Promise.all(
    topProducts.map(async (tp) => {
      const product = await prisma.product.findUnique({
        where: { id: tp.productId },
        select: { name: true },
      });
      return { name: product?.name || "Unknown", quantity: tp._sum.quantity || 0 };
    })
  );

  const rows: string[][] = [
    ["Metric", "Value"],
    ["Total Revenue", formatPaise(totalRevenuePaise)],
    ["Paid Orders", String(orders.length)],
    ["Avg Order Value", formatPaise(avgOrderPaise)],
    ["Active Products", String(products)],
    ["Active B2B Clients", String(clients)],
    [""],
    ["Month", "Revenue (INR)"],
    ...Object.entries(monthlyRevenue).map(([month, revenue]) => [month, revenue.toFixed(2)]),
    [""],
    ["Top Products", "Qty Sold"],
    ...topProductDetails.map((p) => [p.name, String(p.quantity)]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="lohiya-analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
