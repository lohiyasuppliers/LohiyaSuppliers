import { ApplicationType } from "@prisma/client";
import {
  getCachedCatalogTree,
  getCachedNavCategories,
  getCachedLeafCategories,
} from "./cache";

export {
  APPLICATION_LABELS,
  APPLICATION_ROUTES,
  parseApplicationParam,
  type NavCategory,
} from "./catalog-shared";

export { productCardSelect, productListSelect } from "./product-select";

export async function getCatalogTree() {
  return getCachedCatalogTree();
}

export async function getNavCategories() {
  return getCachedNavCategories();
}

export async function getLeafCategories(application?: ApplicationType) {
  const all = await getCachedLeafCategories();
  if (!application) return all;
  return all.filter((c) => c.application === application);
}
