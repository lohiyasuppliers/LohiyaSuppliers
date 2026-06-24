/** Lightweight Prisma selects for product cards/lists (shared by catalog + cache). */
export const productCardSelect = {
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
  variations: {
    where: { isActive: true },
    select: { id: true, defaultPricePaise: true },
    take: 20,
  },
} as const;

export const productListSelect = {
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
      application: true,
      parent: { select: { name: true, slug: true } },
    },
  },
  _count: { select: { variations: { where: { isActive: true } } } },
} as const;
