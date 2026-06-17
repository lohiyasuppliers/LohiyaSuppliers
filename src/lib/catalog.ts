import { prisma } from "./prisma";
import { ApplicationType, CategoryType } from "@prisma/client";

export const APPLICATION_LABELS: Record<ApplicationType, string> = {
  METAL: "Metal Application",
  WOOD: "Wood Application",
  BOTH: "All Applications",
};

export const APPLICATION_ROUTES = {
  all: "/products",
  metal: "/products?application=metal",
  wood: "/products?application=wood",
} as const;

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  application: ApplicationType;
  imageUrl: string | null;
  children: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    productCount: number;
  }[];
}

export async function getCatalogTree() {
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
    imageUrl: dept.imageUrl,
    subcategories: dept.children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      description: child.description,
      imageUrl: child.imageUrl,
      productCount: child._count.products,
    })),
  }));
}

export async function getNavCategories(): Promise<NavCategory[]> {
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

  return departments.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    application: d.application,
    imageUrl: d.imageUrl,
    children: d.children.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      productCount: c._count.products,
    })),
  }));
}

export async function getLeafCategories(application?: ApplicationType) {
  return prisma.category.findMany({
    where: {
      isActive: true,
      parentId: { not: null },
      ...(application ? { application } : {}),
    },
    orderBy: [{ application: "asc" }, { sortOrder: "asc" }],
    select: { id: true, name: true, slug: true, application: true, parentId: true },
  });
}

export function parseApplicationParam(value?: string): ApplicationType | undefined {
  if (value === "metal") return ApplicationType.METAL;
  if (value === "wood") return ApplicationType.WOOD;
  return undefined;
}

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
  variations: { where: { isActive: true }, select: { id: true } },
} as const;
