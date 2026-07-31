import { requireAdminApi } from "@/lib/admin-api";
import { getCrmDashboardData } from "@/lib/crm-data";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/utils";
import { clientCode, productCode, variantCode, variantDisplayName, inrFromPaise } from "@/lib/export-format";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "clients";
  const date = new Date().toISOString().slice(0, 10);

  const data = await getCrmDashboardData();

  if (type === "locations") {
    const headers = [
      "Client Code",
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
    const rows = data.locations.map((l, idx) => [
      clientCode(data.clients.find((c) => c.id === l.id)?.email || `loc${idx}`, idx),
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
    const fullProducts = await prisma.product.findMany({
      include: {
        category: { select: { name: true, parent: { select: { name: true } } } },
        variations: { orderBy: { sku: "asc" } },
      },
      orderBy: { name: "asc" },
    });

    const headers = [
      "Row No",
      "Product Code",
      "Product Name",
      "Brand",
      "Department",
      "Category",
      "HSN",
      "List Price (INR)",
      "Status",
      "Variant Code (SKU)",
      "Variant Name",
      "Variant Price (INR)",
      "Variant Status",
    ];

    const rows: unknown[][] = [];
    let rowNo = 0;
    for (const p of fullProducts) {
      const code = productCode(p.slug);
      const dept = p.category.parent?.name || p.category.name;
      const cat = p.category.parent ? p.category.name : "";
      if (p.variations.length === 0) {
        rowNo += 1;
        rows.push([
          rowNo,
          code,
          p.name,
          p.brand || "",
          dept,
          cat,
          p.hsnCode,
          inrFromPaise(p.defaultPricePaise),
          p.isActive ? "Active" : "Inactive",
          code,
          "Standard",
          inrFromPaise(p.defaultPricePaise),
          "Active",
        ]);
      } else {
        for (let vi = 0; vi < p.variations.length; vi++) {
          const v = p.variations[vi];
          rowNo += 1;
          rows.push([
            rowNo,
            code,
            p.name,
            p.brand || "",
            dept,
            cat,
            p.hsnCode,
            inrFromPaise(p.defaultPricePaise),
            p.isActive ? "Active" : "Inactive",
            variantCode(v.sku, p.slug, vi),
            variantDisplayName(v.label, v.attributes, v.sku),
            inrFromPaise(v.defaultPricePaise),
            v.isActive ? "Active" : "Inactive",
          ]);
        }
      }
    }

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
    "Client Code",
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
    "Status",
    "Orders",
    "Total Spent (INR)",
    "Cashback (INR)",
    "GST Choice",
    "Joined",
    "Last Order",
  ];

  const rows = data.clients.map((c, idx) => [
    clientCode(c.email, idx),
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
