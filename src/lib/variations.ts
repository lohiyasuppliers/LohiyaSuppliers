/** Attribute keys in display order for variant dropdowns. */
const ATTR_ORDER = ["size", "grit", "color", "diameter", "width", "length", "type", "grade"];

type VariantLike = { attributes: Record<string, string> };

export function normalizeAttributes(attrs: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [rawKey, rawVal] of Object.entries(attrs || {})) {
    const key = rawKey.trim().toLowerCase();
    const val = String(rawVal ?? "").trim();
    if (key && val) out[key] = val;
  }
  return out;
}

/** True when most variations only define one attribute (size OR color OR grit per row). */
export function isSparseVariationSet(variations: VariantLike[]): boolean {
  if (variations.length === 0) return false;
  const singleKey = variations.filter(
    (v) => Object.keys(normalizeAttributes(v.attributes)).length <= 1
  ).length;
  return singleKey / variations.length >= 0.5;
}

export function orderedAttributeKeys(variations: VariantLike[]): string[] {
  const keys = new Set<string>();
  for (const v of variations) {
    for (const k of Object.keys(normalizeAttributes(v.attributes))) {
      keys.add(k);
    }
  }
  return [...keys].sort((a, b) => {
    const ai = ATTR_ORDER.indexOf(a.toLowerCase());
    const bi = ATTR_ORDER.indexOf(b.toLowerCase());
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}

export function filterVariationsByAttributes<T extends VariantLike>(
  variations: T[],
  selected: Record<string, string>
): T[] {
  return variations.filter((v) => {
    const attrs = normalizeAttributes(v.attributes);
    return Object.entries(selected).every(([key, val]) => !val || attrs[key] === val);
  });
}

/** All distinct values for one attribute across every variation. */
export function allOptionsForAttribute(variations: VariantLike[], attributeKey: string): string[] {
  const values = new Set<string>();
  for (const v of variations) {
    const val = normalizeAttributes(v.attributes)[attributeKey];
    if (val) values.add(val);
  }
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function optionsForAttribute<T extends VariantLike>(
  variations: T[],
  attributeKey: string,
  selected: Record<string, string>
): string[] {
  if (isSparseVariationSet(variations)) {
    return allOptionsForAttribute(variations, attributeKey);
  }

  const pool = filterVariationsByAttributes(
    variations,
    Object.fromEntries(Object.entries(selected).filter(([k]) => k !== attributeKey))
  );
  const values = new Set<string>();
  for (const v of pool) {
    const val = normalizeAttributes(v.attributes)[attributeKey];
    if (val) values.add(val);
  }
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function findSparseVariation<T extends { id: string; attributes: Record<string, string> }>(
  variations: T[],
  selected: Record<string, string>,
  preferredKey?: string
): T | undefined {
  if (preferredKey && selected[preferredKey]) {
    const direct = variations.find(
      (v) => normalizeAttributes(v.attributes)[preferredKey] === selected[preferredKey]
    );
    if (direct) return direct;
  }

  const ranked = variations
    .map((v) => {
      const attrs = normalizeAttributes(v.attributes);
      const score = Object.entries(attrs).filter(([k, val]) => val && selected[k] === val).length;
      return { v, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.v;
}

export function findVariationByAttributes<T extends { id: string; attributes: Record<string, string> }>(
  variations: T[],
  selected: Record<string, string>,
  keys: string[],
  preferredKey?: string
): T | undefined {
  if (keys.length === 0 || variations.length === 0) return undefined;

  if (isSparseVariationSet(variations)) {
    return findSparseVariation(variations, selected, preferredKey);
  }

  if (keys.some((k) => !selected[k])) return undefined;
  return variations.find((v) => {
    const attrs = normalizeAttributes(v.attributes);
    return keys.every((k) => attrs[k] === selected[k]);
  });
}

export function initialSelectedAttributes(
  variations: VariantLike[],
  keys: string[]
): Record<string, string> {
  if (keys.length === 0) return {};
  const sparse = isSparseVariationSet(variations);
  if (sparse) {
    return Object.fromEntries(
      keys.map((k) => [k, allOptionsForAttribute(variations, k)[0] ?? ""])
    );
  }
  const first = variations[0];
  if (!first) return {};
  const attrs = normalizeAttributes(first.attributes);
  return Object.fromEntries(keys.map((k) => [k, attrs[k] ?? ""]));
}

export function variationLabel(v: { attributes: Record<string, string>; sku?: string }) {
  const attrs = Object.values(normalizeAttributes(v.attributes));
  return attrs.length > 0 ? attrs.join(" · ") : v.sku || "Standard";
}

export function formatAttributeLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function getVariationCount(product: {
  _count?: { variations: number };
  variations?: unknown[];
}): number {
  return product._count?.variations ?? product.variations?.length ?? 0;
}

export function variationCountLabel(count: number): string {
  if (count <= 0) return "";
  return count === 1 ? "1 variant" : `${count} variants`;
}

export function variantOptionsSummary(variations: VariantLike[]): string {
  const keys = orderedAttributeKeys(variations);
  if (keys.length === 0) return "";
  return keys
    .map((key) => {
      const opts = allOptionsForAttribute(variations, key);
      if (opts.length === 0) return null;
      return `${formatAttributeLabel(key)}: ${opts.join(", ")}`;
    })
    .filter(Boolean)
    .join(" · ");
}
