import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { parseJSON } from "@/lib/utils";

function inrFromPaise(paise: number | null | undefined): string {
  if (paise == null) return "";
  return (paise / 100).toFixed(2);
}

function formatDateIso(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function attrsString(attrs: unknown): string {
  if (!attrs || typeof attrs !== "object") return "";
  return Object.entries(attrs as Record<string, string>)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

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

  const headers = [
    "Product ID",
    "Product Name",
    "Slug",
    "Brand",
    "Description",
    "Department",
    "Category",
    "Application",
    "Category Type",
    "HSN Code",
    "GST %",
    "List Price (INR)",
    "Purchase Price (INR)",
    "Purchase Date",
    "Product Active",
    "Image Count",
    "Image URLs",
    "Variation ID",
    "Variation Label",
    "SKU",
    "Variation Price (INR)",
    "Variation Purchase (INR)",
    "Variation Purchase Date",
    "Variation Attributes",
    "Variation Active",
    "Product Created",
    "Product Updated",
  ];

  const rows: unknown[][] = [];

  for (const p of products) {
    const images = parseJSON<string[]>(p.images, []);
    const imageUrls = images.filter(Boolean).join(" | ");
    const base = [
      p.id,
      p.name,
      p.slug,
      p.brand || "",
      p.description.replace(/\s+/g, " ").trim(),
      p.category.parent?.name || p.category.name,
      p.category.parent ? p.category.name : "",
      p.category.application,
      p.category.type,
      p.hsnCode || "",
      ((p.gstRateBps || 0) / 100).toFixed(2),
      inrFromPaise(p.defaultPricePaise),
      inrFromPaise(p.purchasePricePaise),
      formatDateIso(p.purchasePriceDate),
      p.isActive ? "Yes" : "No",
      String(images.length),
      imageUrls,
    ];

    if (p.variations.length === 0) {
      rows.push([
        ...base,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        formatDateIso(p.createdAt),
        formatDateIso(p.updatedAt),
      ]);
    } else {
      for (const v of p.variations) {
        rows.push([
          ...base,
          v.id,
          v.label || "",
          v.sku,
          inrFromPaise(v.defaultPricePaise),
          inrFromPaise(v.purchasePricePaise),
          formatDateIso(v.purchasePriceDate),
          attrsString(v.attributes),
          v.isActive ? "Yes" : "No",
          formatDateIso(p.createdAt),
          formatDateIso(p.updatedAt),
        ]);
      }
    }
  }

  return csvDownloadResponse(
    buildCsv(headers, rows),
    `lohiya-catalog-detail-${new Date().toISOString().slice(0, 10)}.csv`
  );
}
