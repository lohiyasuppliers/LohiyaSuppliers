/** Shared helpers for admin CSV exports — human-readable codes, no internal DB IDs. */

export function inrFromPaise(paise: number | null | undefined): string {
  if (paise == null) return "";
  return (paise / 100).toFixed(2);
}

export function formatExportDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function attrsString(attrs: unknown): string {
  if (!attrs || typeof attrs !== "object") return "";
  return Object.entries(attrs as Record<string, string>)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

export function productCode(slug: string): string {
  return slug.trim().toUpperCase().replace(/-/g, "_");
}

export function variantCode(sku: string | null | undefined, productSlug: string, index: number): string {
  if (sku?.trim()) return sku.trim();
  return `${productCode(productSlug)}-V${index + 1}`;
}

export function variantDisplayName(
  label: string | null | undefined,
  attrs: unknown,
  sku?: string | null
): string {
  if (label?.trim()) return label.trim();
  const fromAttrs = attrsString(attrs);
  if (fromAttrs) return fromAttrs.replace(/;/g, " · ");
  if (sku?.trim()) return sku.trim();
  return "Standard";
}

export type VariationExportRow = {
  label?: string | null;
  sku?: string | null;
  attributes?: unknown;
  defaultPricePaise?: number | null;
  purchasePricePaise?: number | null;
  purchasePriceDate?: Date | null;
  isActive?: boolean;
};

export function variantsSummaryList(variations: VariationExportRow[]): string {
  if (!variations.length) return "";
  return variations
    .map((v, i) => {
      const name = variantDisplayName(v.label, v.attributes, v.sku);
      const price = v.defaultPricePaise != null ? `₹${inrFromPaise(v.defaultPricePaise)}` : "—";
      const code = variantCode(v.sku, "", i);
      return `${name} (${code}) @ ${price}`;
    })
    .join(" | ");
}

export function clientCode(email: string, index: number): string {
  const local = email.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
  return local ? `CLI-${local}` : `CLI-${String(index + 1).padStart(4, "0")}`;
}

export function categoryCode(slug: string): string {
  return `CAT-${slug.toUpperCase().replace(/-/g, "_")}`;
}

export function truncateText(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}
