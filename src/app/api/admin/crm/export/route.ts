import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getCrmDashboardData } from "@/lib/crm-data";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { formatPaise } from "@/lib/utils";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "clients";

  const data = await getCrmDashboardData();

  if (type === "categories") {
    const headers = ["Category", "Slug", "Application", "Product Count"];
    const rows = data.categoryBreakdown.map((c) => [
      c.name,
      c.slug,
      c.application,
      String(c.productCount),
    ]);
    return csvDownloadResponse(
      buildCsv(headers, rows),
      `crm-categories-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  if (type === "brands") {
    const headers = ["Brand", "Active Products"];
    const rows = data.brandBreakdown.map((b) => [b.brand, String(b.productCount)]);
    return csvDownloadResponse(
      buildCsv(headers, rows),
      `crm-brands-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  const headers = [
    "Client ID",
    "Name",
    "Email",
    "Phone",
    "Company",
    "GSTIN",
    "State",
    "City",
    "Address",
    "Pincode",
    "Type",
    "Active",
    "Orders",
    "Total Spent (INR)",
    "Cashback Balance (INR)",
    "GST Choice",
    "Joined",
    "Last Order",
  ];

  const rows = data.clients.map((c) => [
    c.id,
    c.name,
    c.email,
    c.phone || "",
    c.company,
    c.gstin || "",
    c.billingState,
    c.city || "",
    c.address || "",
    c.pincode || "",
    c.clientType,
    c.isActive ? "Yes" : "No",
    String(c.orderCount),
    formatPaise(c.totalSpentPaise).replace("₹", ""),
    formatPaise(c.cashbackBalancePaise).replace("₹", ""),
    c.allowGstChoice ? "Yes" : "No",
    c.createdAt.slice(0, 10),
    c.lastOrderAt ? c.lastOrderAt.slice(0, 10) : "",
  ]);

  return csvDownloadResponse(
    buildCsv(headers, rows),
    `crm-clients-${new Date().toISOString().slice(0, 10)}.csv`
  );
}
