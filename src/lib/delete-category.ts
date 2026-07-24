import { prisma } from "@/lib/prisma";
import { CategoryType, ApplicationType } from "@prisma/client";

async function hardDeleteProduct(productId: string) {
  await prisma.productVariation.deleteMany({ where: { productId } });
  await prisma.clientPriceOverride.deleteMany({ where: { productId } });
  await prisma.cashbackRule.deleteMany({ where: { productId } });
  await prisma.productDiscountRule.deleteMany({ where: { productId } });
  await prisma.clientVoucher.deleteMany({ where: { productId } });
  await prisma.product.delete({ where: { id: productId } });
}

async function archiveProduct(productId: string, archivedCategoryId: string) {
  // Keep variations — order items may reference them
  await prisma.clientPriceOverride.deleteMany({ where: { productId } });
  await prisma.cashbackRule.deleteMany({ where: { productId } });
  await prisma.productDiscountRule.deleteMany({ where: { productId } });
  await prisma.clientVoucher.deleteMany({ where: { productId } });
  await prisma.product.update({
    where: { id: productId },
    data: { categoryId: archivedCategoryId, isActive: false },
  });
}

async function getOrCreateArchivedCategory() {
  const existing = await prisma.category.findFirst({
    where: { slug: "archived" },
  });
  if (existing) return existing;

  return prisma.category.create({
    data: {
      name: "Archived",
      slug: "archived",
      description: "Products kept for order history after their category was deleted.",
      type: CategoryType.PRODUCT,
      application: ApplicationType.BOTH,
      parentId: null,
      sortOrder: 9999,
      isActive: false,
    },
  });
}

/**
 * Deletes a category and its subcategories.
 * - Products without order history are removed.
 * - Products with order history are deactivated and moved to "Archived".
 */
export async function deleteCategoryCascade(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new Error("Category not found");
  }
  if (category.slug === "archived") {
    throw new Error("The Archived category cannot be deleted");
  }

  const children = await prisma.category.findMany({
    where: { parentId: categoryId },
    select: { id: true, slug: true },
  });
  const categoryIds = [categoryId, ...children.map((c) => c.id)];

  const products = await prisma.product.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { id: true },
  });

  let deletedProducts = 0;
  let archivedProducts = 0;
  let archivedCategoryId: string | null = null;

  for (const product of products) {
    const orderItemCount = await prisma.orderItem.count({
      where: { productId: product.id },
    });

    if (orderItemCount > 0) {
      if (!archivedCategoryId) {
        archivedCategoryId = (await getOrCreateArchivedCategory()).id;
      }
      // Don't move into archived if we're somehow deleting archived itself
      if (archivedCategoryId === categoryId || categoryIds.includes(archivedCategoryId)) {
        throw new Error("Cannot delete category while archiving products into it");
      }
      await archiveProduct(product.id, archivedCategoryId);
      archivedProducts += 1;
    } else {
      await hardDeleteProduct(product.id);
      deletedProducts += 1;
    }
  }

  await prisma.clientVoucher.updateMany({
    where: { categoryId: { in: categoryIds } },
    data: { categoryId: null },
  });

  const childIds = children.filter((c) => c.slug !== "archived").map((c) => c.id);
  if (childIds.length > 0) {
    await prisma.category.deleteMany({ where: { id: { in: childIds } } });
  }

  await prisma.category.delete({ where: { id: categoryId } });

  return {
    success: true,
    deletedSubcategories: childIds.length,
    deletedProducts,
    archivedProducts,
  };
}
