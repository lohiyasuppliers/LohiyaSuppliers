import { prisma } from "@/lib/prisma";

export const BASE_BRAND_OPTIONS = ["Deerfros", "Leitz", "AIPL", "Other"];

export function mergeBrandOptions(dbBrands: string[]): string[] {
  const set = new Set<string>();
  for (const b of BASE_BRAND_OPTIONS) {
    if (b !== "Other") set.add(b);
  }
  for (const b of dbBrands) {
    const t = b?.trim();
    if (t && t !== "Other") set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function normalizeBrandInput(value: unknown): string | null {
  if (value == null) return null;
  const t = String(value).trim();
  if (!t || t === "Other") return null;
  return t;
}

export async function fetchDistinctProductBrands(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { brand: { not: null } },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => r.brand!).filter((b) => b?.trim());
}
