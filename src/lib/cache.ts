import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { getPlatformSettings } from "./settings";
import { getNavCategories } from "./catalog";

export const getCachedSettings = unstable_cache(
  async () => getPlatformSettings(),
  ["platform-settings"],
  { revalidate: 300, tags: ["settings"] }
);

export const getCachedCatalogTree = unstable_cache(
  async () => getNavCategories(),
  ["catalog-tree"],
  { revalidate: 300, tags: ["categories"] }
);

export const getCachedCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: { isActive: true, parentId: { not: null } },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true, type: true },
    }),
  ["nav-categories"],
  { revalidate: 300, tags: ["categories"] }
);
