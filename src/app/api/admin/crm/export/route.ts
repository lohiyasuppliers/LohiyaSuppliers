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
  const date = new Date().toISOString().slice(0, 10);

  const data = await getCrmDashboardData();

  if (type === "locations") {
    const headers = [
      "Client ID",
      "Name",
      "Company",
      "Phone",
      "Full Address",
      "City",
      "State",
      "Pincode",
      "Country",
      "Map URL",
      "Client Type",
      "Orders",
    ];
    const rows = data.locations.map((l) => [
      l.id,
      l.name,
      l.company,
      l.phone || "",
      l.fullAddress,
      l.city,
      l.state,
      l.pincode || "",
      "India",
      l.mapUrl,
      l.clientType,
      String(l.orderCount),
    ]);
    return csvDownloadResponse(buildCsv(headers, rows), `crm-locations-${date}.csv`);
  }

  if (type === "products") {
    const headers = [
      "Product ID",
      "Name",
      "Slug",
      "Brand",
      "Department",
      "Category",
      "Application",
      "HSN",
      "List Price (INR)",
      "Variations",
      "Active",
    ];
    const rows = data.products.map((p) => [
      p.id,
      p.name,
      p.slug,
      p.brand || "",
      p.department,
      p.category,
      p.application,
      p.hsnCode,
      (p.defaultPricePaise / 100).toFixed(2),
      String(p.variationCount),
      p.isActive ? "Yes" : "No",
    ]);
    return csvDownloadResponse(buildCsv(headers, rows), `crm-products-${date}.csv`);
  }

  if (type === "categories") {
    const headers = ["Category", "Slug", "Department", "Application", "Type", "Products", "Active"];
    const rows = data.categories.map((c) => [
      c.name,
      c.slug,
      c.department,
      c.application,
      c.type,
      String(c.productCount),
      c.isActive ? "Yes" : "No",
    ]);
    return csvDownloadResponse(buildCsv(headers, rows), `crm-categories-${date}.csv`);
  }

  if (type === "departments") {
    const headers = ["Department", "Slug", "Application", "Subcategories", "Products", "Active"];
    const rows = data.departments.map((d) => [
      d.name,
      d.slug,
      d.application,
      String(d.subcategoryCount),
      String(d.productCount),
      d.isActive ? "Yes" : "No",
    ]);
    return csvDownloadResponse(buildCsv(headers, rows), `crm-departments-${date}.csv`);
  }

  if (type === "brands") {
    const headers = ["Brand", "Product Count"];
    const rows = data.brandBreakdown.map((b) => [b.brand, String(b.productCount)]);
    return csvDownloadResponse(buildCsv(headers, rows), `crm-brands-${date}.csv`);
  }

  const headers = [
    "Client ID",
    "Name",
    "Email",
    "Phone",
    "Company",
    "GSTIN",
    "Full Address",
    "State",
    "City",
    "Address Line",
    "Pincode",
    "Country",
    "Map URL",
    "Type",
    "Active",
    "Orders",
    "Total Spent (INR)",
    "Cashback (INR)",
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
    c.fullAddress,
    c.billingState,
    c.city || "",
    c.address || "",
    c.pincode || "",
    c.country,
    c.mapUrl,
    c.clientType,
    c.isActive ? "Yes" : "No",
    String(c.orderCount),
    formatPaise(c.totalSpentPaise).replace("₹", ""),
    formatPaise(c.cashbackBalancePaise).replace("₹", ""),
    c.allowGstChoice ? "Yes" : "No",
    c.createdAt.slice(0, 10),
    c.lastOrderAt ? c.lastOrderAt.slice(0, 10) : "",
  ]);

  return csvDownloadResponse(buildCsv(headers, rows), `crm-clients-${date}.csv`);
}
