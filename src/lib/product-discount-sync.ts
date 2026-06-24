import { prisma } from "./prisma";
import { DiscountType, Prisma } from "@prisma/client";

type Db = typeof prisma | Prisma.TransactionClient;

/** Keep product discount in sync with cashback (same ₹/unit). Safe if Prisma client is stale. */
export async function syncProductDiscountFromCashback(
  clientId: string,
  productId: string,
  variationId: string,
  valuePaise: number,
  db: Db = prisma
) {
  const delegate = (db as { productDiscountRule?: { upsert: Function; deleteMany: Function } })
    .productDiscountRule;
  if (!delegate?.upsert) return;

  await delegate.upsert({
    where: {
      clientId_productId_variationId: { clientId, productId, variationId },
    },
    update: {
      type: DiscountType.FIXED,
      valuePaise,
      valueBps: null,
      isActive: true,
    },
    create: {
      clientId,
      productId,
      variationId,
      type: DiscountType.FIXED,
      valuePaise,
      isActive: true,
    },
  });
}

export async function deleteProductDiscountRule(
  clientId: string,
  productId: string,
  variationId: string,
  db: Db = prisma
) {
  const delegate = (db as { productDiscountRule?: { deleteMany: Function } }).productDiscountRule;
  if (!delegate?.deleteMany) return;
  await delegate.deleteMany({ where: { clientId, productId, variationId } });
}

export async function upsertProductDiscountRule(
  clientId: string,
  productId: string,
  variationId: string,
  valuePaise: number,
  db: Db = prisma
) {
  const delegate = (db as { productDiscountRule?: { upsert: Function } }).productDiscountRule;
  if (!delegate?.upsert) return false;

  await delegate.upsert({
    where: {
      clientId_productId_variationId: { clientId, productId, variationId },
    },
    update: {
      type: DiscountType.FIXED,
      valuePaise,
      valueBps: null,
      isActive: true,
    },
    create: {
      clientId,
      productId,
      variationId,
      type: DiscountType.FIXED,
      valuePaise,
      isActive: true,
    },
  });
  return true;
}

export async function countProductDiscountRules(clientId: string, db: Db = prisma) {
  const delegate = (db as { productDiscountRule?: { count: Function } }).productDiscountRule;
  if (!delegate?.count) return null;
  return delegate.count({ where: { clientId, isActive: true } }) as Promise<number>;
}
