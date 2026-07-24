import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthApi } from "@/lib/rbac";
import { formatDate, formatPaise } from "@/lib/utils";

export async function GET() {
  const auth = await requireAuthApi();
  if (!auth.authorized) return auth.response;

  const clientId = auth.session.user.id;

  const orders = await prisma.order.findMany({
    where: { clientId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Order Number",
    "Date",
    "Status",
    "Payment",
    "Items",
    "Subtotal",
    "Tax (GST)",
    "Total",
    "Paid",
    "Balance Due",
  ];

  const rows = orders.map((o) => {
    const balance = Math.max(0, o.totalPaise - o.paidPaise);
    return [
      o.orderNumber,
      formatDate(o.createdAt),
      o.status,
      o.paymentStatus,
      o.items
        .map(
          (i) =>
            `${i.productName}${i.variationLabel ? ` (${i.variationLabel})` : ""} x${i.quantity}`
        )
        .join("; "),
      formatPaise(o.subtotalPaise).replace("₹", ""),
      formatPaise(o.taxPaise).replace("₹", ""),
      formatPaise(o.totalPaise).replace("₹", ""),
      formatPaise(o.paidPaise).replace("₹", ""),
      formatPaise(balance).replace("₹", ""),
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="my-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
