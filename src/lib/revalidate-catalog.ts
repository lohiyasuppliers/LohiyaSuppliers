import { revalidateTag } from "next/cache";

/** Invalidate cached product lists, detail pages, and featured sections. */
export function revalidateProductCatalog() {
  revalidateTag("products");
}
