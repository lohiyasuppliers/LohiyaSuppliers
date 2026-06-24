/**
 * Refresh category & product images in the database from catalog-data.
 * Run: npm run db:refresh-images
 */
import { PrismaClient } from "@prisma/client";
import { CATALOG } from "./catalog-data";
import {
  categoryImageForSlug,
  CATALOG_IMAGES,
  normalizeImageUrl,
} from "../src/lib/catalog-images";

const prisma = new PrismaClient();

async function main() {
  let categories = 0;
  let products = 0;

  for (const dept of CATALOG) {
    await prisma.category.updateMany({
      where: { slug: dept.slug },
      data: { imageUrl: dept.imageUrl },
    });
    categories++;

    for (const sub of dept.subcategories) {
      await prisma.category.updateMany({
        where: { slug: sub.slug },
        data: { imageUrl: sub.imageUrl },
      });
      categories++;

      for (const item of sub.products) {
        const images = JSON.stringify(
          item.images.map((u) => normalizeImageUrl(u))
        );
        const result = await prisma.product.updateMany({
          where: { slug: item.slug },
          data: { images },
        });
        if (result.count) products += result.count;
      }
    }
  }

  // Fix any categories/products still pointing at broken Unsplash URLs
  const allCategories = await prisma.category.findMany({
    select: { id: true, slug: true, imageUrl: true },
  });
  for (const cat of allCategories) {
    const next =
      cat.imageUrl?.startsWith("/")
        ? cat.imageUrl
        : categoryImageForSlug(cat.slug);
    if (cat.imageUrl !== next) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { imageUrl: next },
      });
      categories++;
    }
  }

  const allProducts = await prisma.product.findMany({
    select: { id: true, images: true },
  });
  for (const p of allProducts) {
    let arr: string[] = [];
    try {
      arr = JSON.parse(p.images || "[]") as string[];
    } catch {
      arr = [];
    }
    const normalized = arr.map((u) => normalizeImageUrl(u));
    const fallback =
      normalized[0] === CATALOG_IMAGES.productDefault && normalized.length === 0
        ? [CATALOG_IMAGES.productDefault]
        : normalized.length
          ? normalized
          : [CATALOG_IMAGES.productDefault];
    const next = JSON.stringify(fallback);
    if (next !== p.images) {
      await prisma.product.update({ where: { id: p.id }, data: { images: next } });
      products++;
    }
  }

  console.log(`Refreshed images — categories touched: ${categories}, products: ${products}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
