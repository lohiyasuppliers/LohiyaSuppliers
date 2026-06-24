import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { getPlatformSettings } from "./settings";
import { ApplicationType, CategoryType, Prisma } from "@prisma/client";
import { categoryImageForSlug, normalizeImageUrl } from "./catalog-images";
import { productCardSelect } from "./product-select";

export const getCachedSettings = unstable_cache(
  async () => getPlatformSettings(),
  ["platform-settings"],
  { revalidate: 300, tags: ["settings"] }
);

async function fetchCatalogFromDb() {
  const departments = await prisma.category.findMany({
    where: { isActive: true, parentId: null, type: CategoryType.PRODUCT },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: { where: { isActive: true } } } } },
      },
    },
  });

  return departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    slug: dept.slug,
    description: dept.description,
    application: dept.application,
    imageUrl: normalizeImageUrl(dept.imageUrl) || categoryImageForSlug(dept.slug),
    subcategories: dept.children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      description: child.description,
      imageUrl: normalizeImageUrl(child.imageUrl) || categoryImageForSlug(child.slug),
      productCount: child._count.products,
    })),
  }));
}

/** Full catalog tree — shared cache for layout, homepage, products. */
export const getCachedCatalogTree = unstable_cache(
  fetchCatalogFromDb,
  ["catalog-tree-full"],
  { revalidate: 300, tags: ["categories"] }
);

/** Nav shape (children instead of subcategories) — same cached data. */
export async function getCachedNavCategories() {
  const tree = await getCachedCatalogTree();
  return tree.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    application: d.application,
    imageUrl: d.imageUrl,
    children: d.subcategories.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      imageUrl: s.imageUrl,
      productCount: s.productCount,
    })),
  }));
}

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

export const getCachedLeafCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: { isActive: true, parentId: { not: null } },
      orderBy: [{ application: "asc" }, { sortOrder: "asc" }],
      select: { id: true, name: true, slug: true, application: true, parentId: true },
    }),
  ["leaf-categories"],
  { revalidate: 300, tags: ["categories"] }
);

export const getCachedSiteStats = unstable_cache(
  async () => {
    const [productCount, variationCount, subcategoryCount] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.productVariation.count({ where: { isActive: true } }),
      prisma.category.count({ where: { parentId: { not: null }, isActive: true } }),
    ]);
    return { productCount, variationCount, subcategoryCount };
  },
  ["site-stats"],
  { revalidate: 300, tags: ["products", "categories"] }
);

export const getCachedFeaturedProducts = unstable_cache(
  async () =>
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        description: true,
        defaultPricePaise: true,
        images: true,
        category: {
          select: {
            name: true,
            slug: true,
            type: true,
            parent: { select: { name: true, slug: true } },
          },
        },
        _count: { select: { variations: { where: { isActive: true } } } },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ["featured-products"],
  { revalidate: 30, tags: ["products"] }
);

export const getCachedBrands = unstable_cache(
  async () => {
    const rows = await prisma.product.findMany({
      where: { isActive: true, brand: { not: null } },
      select: { brand: true },
      distinct: ["brand"],
    });
    return rows.map((b) => b.brand!).filter(Boolean).sort();
  },
  ["product-brands"],
  { revalidate: 300, tags: ["products"] }
);

export type ProductListCacheKey = {
  application?: string;
  category?: string;
  brand?: string;
  sort?: string;
};

function productListOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
  if (sort === "price-asc") return { defaultPricePaise: "asc" };
  if (sort === "price-desc") return { defaultPricePaise: "desc" };
  if (sort === "name") return { name: "asc" };
  return { createdAt: "desc" };
}

function productListWhere(key: ProductListCacheKey): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (key.category) {
    where.category = { slug: key.category };
  } else if (key.application === "metal") {
    where.category = { application: ApplicationType.METAL };
  } else if (key.application === "wood") {
    where.category = { application: ApplicationType.WOOD };
  }

  if (key.brand) where.brand = key.brand;

  return where;
}

/** Cached catalog product lists (no text search). */
export async function getCachedProductList(key: ProductListCacheKey) {
  const cacheKey = JSON.stringify(key);
  return unstable_cache(
    async () =>
      prisma.product.findMany({
        where: productListWhere(key),
        select: productCardSelect,
        orderBy: productListOrderBy(key.sort),
      }),
    ["product-list", cacheKey],
    { revalidate: 30, tags: ["products"] }
  )();
}

export async function getCachedProductBySlug(slug: string) {
  return unstable_cache(
    async () =>
      prisma.product.findUnique({
        where: { slug, isActive: true },
        include: {
          category: { include: { parent: true } },
          variations: { where: { isActive: true }, orderBy: { sku: "asc" } },
        },
      }),
    ["product-detail", slug],
    { revalidate: 30, tags: ["products"] }
  )();
}

export async function getCachedRelatedProducts(
  productId: string,
  categoryId: string,
  brand: string | null
) {
  return unstable_cache(
    async () =>
      prisma.product.findMany({
        where: {
          isActive: true,
          id: { not: productId },
          OR: [{ categoryId }, ...(brand ? [{ brand }] : [])],
        },
        select: productCardSelect,
        take: 4,
        orderBy: { name: "asc" },
      }),
    ["related-products", productId],
    { revalidate: 30, tags: ["products"] }
  )();
}
