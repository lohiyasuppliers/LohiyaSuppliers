/** Auto-generate unique variation SKUs — never entered manually by admin. */
export function generateVariationSku(
  brand: string | null | undefined,
  productSlug: string,
  attributes: Record<string, string>,
  index = 0
): string {
  const brandCode = (brand || "GEN").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  const productCode = productSlug.toUpperCase().replace(/-/g, "").slice(0, 10);
  const attrParts = Object.entries(attributes)
    .filter(([, val]) => val?.trim())
    .map(([, val]) => val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
  const attrCode = attrParts.length > 0 ? attrParts.join("-").slice(0, 24) : `VAR${index + 1}`;
  return `${brandCode}-${productCode}-${attrCode}`;
}
