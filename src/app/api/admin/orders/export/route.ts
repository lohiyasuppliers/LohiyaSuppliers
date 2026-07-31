import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { formatDate, formatPaise } from "@/lib/utils";
import { clientCode } from "@/lib/export-format";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const orders = await prisma.order.findMany({
    include: {
      client: { select: { name: true, email: true, phone: true, clientProfile: true } },
      items: { include: { product: { select: { slug: true, brand: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Order Number",
    "Client Code",
    "Client Name",
    "Email",
    "Phone",
    "Company",
    "Order Status",
    "Payment Status",
    "Subtotal (INR)",
    "Tax (INR)",
    "Total (INR)",
    "Paid (INR)",
    "Balance (INR)",
    "Line Items (Product | Variant | Qty | Amount)",
    "Order Date",
  ];

  const rows = orders.map((o, idx) => [
    o.orderNumber,
    clientCode(o.client.email, idx),
    o.client.name || "",
    o.client.email,
    o.client.phone || "",
    o.client.clientProfile?.company || "",
    o.status.replace(/_/g, " "),
    o.paymentStatus.replace(/_/g, " "),
    formatPaise(o.subtotalPaise).replace("₹", ""),
    formatPaise(o.taxPaise).replace("₹", ""),
    formatPaise(o.totalPaise).replace("₹", ""),
    formatPaise(o.paidPaise).replace("₹", ""),
    formatPaise(o.pendingPaymentPaise).replace("₹", ""),
    o.items
      .map((i) => {
        const variant = i.variationLabel ? ` [${i.variationLabel}]` : "";
        const brand = i.product.brand ? ` (${i.product.brand})` : "";
        return `${i.productName}${brand}${variant} ×${i.quantity} = ${formatPaise(i.totalPaise)}`;
      })
      .join(" | "),
    formatDate(o.createdAt),
  ]);

  return csvDownloadResponse(
    buildCsv(headers, rows),
    `lohiya-orders-${new Date().toISOString().slice(0, 10)}.csv`
  );
}
