import { revalidateTag } from "next/cache";

/** Invalidate cached product lists, detail pages, categories, and settings. */
export function revalidateProductCatalog() {
  revalidateTag("products");
  revalidateTag("categories");
  revalidateTag("settings");
}

export function revalidateCategories() {
  revalidateTag("categories");
}

export function revalidateSettings() {
  revalidateTag("settings");
}
