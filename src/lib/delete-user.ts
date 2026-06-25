import { prisma } from "@/lib/prisma";

/** Permanently removes a client user and all related records (MongoDB NoAction relations). */
export async function deleteUserPermanently(userId: string) {
  const orderIds = (
    await prisma.order.findMany({
      where: { clientId: userId },
      select: { id: true },
    })
  ).map((o) => o.id);

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }),
    prisma.cashbackLedgerEntry.deleteMany({
      where: { OR: [{ clientId: userId }, { orderId: { in: orderIds } }] },
    }),
    prisma.cashbackWalletEntry.deleteMany({
      where: { OR: [{ clientId: userId }, { orderId: { in: orderIds } }] },
    }),
    prisma.order.deleteMany({ where: { clientId: userId } }),
    prisma.clientBill.deleteMany({ where: { clientId: userId } }),
    prisma.clientDiscountRule.deleteMany({ where: { clientId: userId } }),
    prisma.cashbackRedemption.deleteMany({ where: { clientId: userId } }),
    prisma.clientVoucher.deleteMany({ where: { clientId: userId } }),
    prisma.productDiscountRule.deleteMany({ where: { clientId: userId } }),
    prisma.cashbackRule.deleteMany({ where: { clientId: userId } }),
    prisma.clientPriceOverride.deleteMany({ where: { clientId: userId } }),
    prisma.clientProfile.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
