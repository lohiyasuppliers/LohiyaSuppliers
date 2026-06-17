import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { formatDate, formatPaise } from "@/lib/utils";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const orders = await prisma.order.findMany({
    include: {
      client: { select: { name: true, email: true, phone: true, clientProfile: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Order Number",
    "Client",
    "Email",
    "Phone",
    "Company",
    "Status",
    "Payment",
    "Subtotal",
    "Tax",
    "Total",
    "Items",
    "Date",
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    o.client.name || "—",
    o.client.email,
    o.client.phone || "",
    o.client.clientProfile?.company || "",
    o.status,
    o.paymentStatus,
    formatPaise(o.subtotalPaise).replace("₹", ""),
    formatPaise(o.taxPaise).replace("₹", ""),
    formatPaise(o.totalPaise).replace("₹", ""),
    o.items
      .map((i) => `${i.productName}${i.variationLabel ? ` (${i.variationLabel})` : ""} x${i.quantity}`)
      .join("; "),
    formatDate(o.createdAt),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="lohiya-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
