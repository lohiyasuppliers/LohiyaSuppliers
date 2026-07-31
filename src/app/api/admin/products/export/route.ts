import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { parseJSON } from "@/lib/utils";
import {
  attrsString,
  formatExportDate,
  inrFromPaise,
  productCode,
  truncateText,
  variantCode,
  variantDisplayName,
  variantsSummaryList,
} from "@/lib/export-format";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const view = new URL(req.url).searchParams.get("view") || "detail";
  const date = new Date().toISOString().slice(0, 10);

  const products = await prisma.product.findMany({
    include: {
      category: {
        select: {
          name: true,
          slug: true,
          application: true,
          type: true,
          parent: { select: { name: true, slug: true } },
        },
      },
      variations: { orderBy: { sku: "asc" } },
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  if (view === "summary") {
    const headers = [
      "Row No",
      "Product Code",
      "Product Name",
      "Brand",
      "Department",
      "Category",
      "Application",
      "Category Type",
      "HSN Code",
      "GST %",
      "List Price (INR)",
      "Purchase Price (INR)",
      "Purchase Date",
      "Status",
      "Variant Count",
      "All Variants (Name | Code | Price INR)",
      "Description",
      "Image URLs",
      "Created",
      "Updated",
    ];

    const rows = products.map((p, idx) => {
      const images = parseJSON<string[]>(p.images, []);
      const code = productCode(p.slug);
      return [
        idx + 1,
        code,
        p.name,
        p.brand || "",
        p.category.parent?.name || p.category.name,
        p.category.parent ? p.category.name : "",
        p.category.application,
        p.category.type,
        p.hsnCode || "",
        ((p.gstRateBps || 0) / 100).toFixed(2),
        inrFromPaise(p.defaultPricePaise),
        inrFromPaise(p.purchasePricePaise),
        formatExportDate(p.purchasePriceDate),
        p.isActive ? "Active" : "Inactive",
        String(p.variations.length),
        variantsSummaryList(
          p.variations.map((v, vi) => ({
            label: v.label,
            sku: variantCode(v.sku, p.slug, vi),
            attributes: v.attributes,
            defaultPricePaise: v.defaultPricePaise,
          }))
        ),
        truncateText(p.description, 300),
        images.filter(Boolean).join(" | "),
        formatExportDate(p.createdAt),
        formatExportDate(p.updatedAt),
      ];
    });

    return csvDownloadResponse(
      buildCsv(headers, rows),
      `lohiya-catalog-summary-${date}.csv`
    );
  }

  const headers = [
    "Row No",
    "Product Code",
    "Product Name",
    "Brand",
    "Department",
    "Category",
    "Application",
    "Category Type",
    "HSN Code",
    "GST %",
    "Product List Price (INR)",
    "Product Purchase Price (INR)",
    "Product Purchase Date",
    "Product Status",
    "Description",
    "Image URLs",
    "Variant Code (SKU)",
    "Variant Name",
    "Variant List Price (INR)",
    "Variant Purchase Price (INR)",
    "Variant Purchase Date",
    "Variant Attributes",
    "Variant Status",
    "Total Variants",
    "Product Created",
    "Product Updated",
  ];

  const rows: unknown[][] = [];
  let rowNo = 0;

  for (const p of products) {
    const images = parseJSON<string[]>(p.images, []);
    const imageUrls = images.filter(Boolean).join(" | ");
    const code = productCode(p.slug);
    const base = [
      "", // row no filled per row
      code,
      p.name,
      p.brand || "",
      p.category.parent?.name || p.category.name,
      p.category.parent ? p.category.name : "",
      p.category.application,
      p.category.type,
      p.hsnCode || "",
      ((p.gstRateBps || 0) / 100).toFixed(2),
      inrFromPaise(p.defaultPricePaise),
      inrFromPaise(p.purchasePricePaise),
      formatExportDate(p.purchasePriceDate),
      p.isActive ? "Active" : "Inactive",
      truncateText(p.description, 300),
      imageUrls,
    ];
    const variantCount = String(p.variations.length);

    if (p.variations.length === 0) {
      rowNo += 1;
      rows.push([
        rowNo,
        ...base,
        "",
        "Standard (no variants)",
        inrFromPaise(p.defaultPricePaise),
        "",
        "",
        "",
        "Active",
        variantCount,
        formatExportDate(p.createdAt),
        formatExportDate(p.updatedAt),
      ]);
    } else {
      for (let vi = 0; vi < p.variations.length; vi++) {
        const v = p.variations[vi];
        rowNo += 1;
        rows.push([
          rowNo,
          ...base,
          variantCode(v.sku, p.slug, vi),
          variantDisplayName(v.label, v.attributes, v.sku),
          inrFromPaise(v.defaultPricePaise),
          inrFromPaise(v.purchasePricePaise),
          formatExportDate(v.purchasePriceDate),
          attrsString(v.attributes),
          v.isActive ? "Active" : "Inactive",
          variantCount,
          formatExportDate(p.createdAt),
          formatExportDate(p.updatedAt),
        ]);
      }
    }
  }

  return csvDownloadResponse(
    buildCsv(headers, rows),
    `lohiya-catalog-detail-${date}.csv`
  );
}
