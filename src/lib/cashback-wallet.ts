import {
  CashbackRedemptionType,
  CashbackWalletSource,
  CashbackWalletStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "./prisma";
import { DEFAULT_CASHBACK_EXPIRY_DAYS } from "./discount-rules";
import { cashbackPaiseForLine, type CashbackRuleRow } from "./cashback-rules";

export function cashbackExpiryDate(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + DEFAULT_CASHBACK_EXPIRY_DAYS);
  return d;
}

/** Mark past-due wallet entries as expired (single client). */
export async function expireDueWalletEntries(
  clientId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  const now = new Date();
  await db.cashbackWalletEntry.updateMany({
    where: {
      clientId,
      status: { in: [CashbackWalletStatus.LOCKED, CashbackWalletStatus.AVAILABLE] },
      expiresAt: { lte: now },
    },
    data: { status: CashbackWalletStatus.EXPIRED },
  });
}

/** Batch-expire all overdue entries (one query). */
export async function expireAllDueWalletEntries(
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  const now = new Date();
  await db.cashbackWalletEntry.updateMany({
    where: {
      status: { in: [CashbackWalletStatus.LOCKED, CashbackWalletStatus.AVAILABLE] },
      expiresAt: { lte: now },
    },
    data: { status: CashbackWalletStatus.EXPIRED },
  });
}

export function sumWalletBalances(
  entries: Array<{ amountPaise: number; status: CashbackWalletStatus; expiresAt: Date }>,
  now = new Date()
) {
  let lockedPaise = 0;
  let availablePaise = 0;
  for (const e of entries) {
    if (e.expiresAt <= now) continue;
    if (e.status === CashbackWalletStatus.LOCKED) lockedPaise += e.amountPaise;
    else if (e.status === CashbackWalletStatus.AVAILABLE) availablePaise += e.amountPaise;
  }
  return { lockedPaise, availablePaise, totalActivePaise: lockedPaise + availablePaise };
}

export async function getWalletBalances(clientId: string, options?: { skipExpire?: boolean }) {
  if (!options?.skipExpire) {
    await expireDueWalletEntries(clientId);
  }
  const now = new Date();
  const entries = await prisma.cashbackWalletEntry.findMany({
    where: {
      clientId,
      status: { in: [CashbackWalletStatus.LOCKED, CashbackWalletStatus.AVAILABLE] },
      expiresAt: { gt: now },
    },
    select: { amountPaise: true, status: true, expiresAt: true },
  });

  return sumWalletBalances(entries, now);
}

async function syncProfileBalance(
  clientId: string,
  db: Prisma.TransactionClient
) {
  const now = new Date();
  const available = await db.cashbackWalletEntry.aggregate({
    where: {
      clientId,
      status: CashbackWalletStatus.AVAILABLE,
      expiresAt: { gt: now },
    },
    _sum: { amountPaise: true },
  });

  await db.clientProfile.update({
    where: { userId: clientId },
    data: { cashbackBalancePaise: available._sum.amountPaise ?? 0 },
  });
}

export async function createOrderCashbackEntry(
  clientId: string,
  orderId: string,
  amountPaise: number,
  immediatelyAvailable: boolean,
  db: Prisma.TransactionClient
) {
  if (amountPaise <= 0) return null;

  const earnedAt = new Date();
  const entry = await db.cashbackWalletEntry.create({
    data: {
      clientId,
      orderId,
      amountPaise,
      status: immediatelyAvailable
        ? CashbackWalletStatus.AVAILABLE
        : CashbackWalletStatus.LOCKED,
      source: CashbackWalletSource.ORDER,
      earnedAt,
      unlockedAt: immediatelyAvailable ? earnedAt : null,
      expiresAt: cashbackExpiryDate(earnedAt),
    },
  });

  if (immediatelyAvailable) {
    await syncProfileBalance(clientId, db);
    await db.cashbackLedgerEntry.create({
      data: {
        clientId,
        type: "EARNED",
        amountPaise,
        balanceAfterPaise: (
          await db.clientProfile.findUnique({ where: { userId: clientId } })
        )?.cashbackBalancePaise ?? amountPaise,
        orderId,
        description: `Cashback earned (available) on order`,
      },
    });
  }

  return entry;
}

export async function unlockCashbackForOrder(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const entries = await tx.cashbackWalletEntry.findMany({
      where: { orderId, status: CashbackWalletStatus.LOCKED },
    });
    if (entries.length === 0) return;

    const clientId = entries[0].clientId;
    const now = new Date();

    for (const e of entries) {
      if (e.expiresAt <= now) {
        await tx.cashbackWalletEntry.update({
          where: { id: e.id },
          data: { status: CashbackWalletStatus.EXPIRED },
        });
        continue;
      }
      await tx.cashbackWalletEntry.update({
        where: { id: e.id },
        data: {
          status: CashbackWalletStatus.AVAILABLE,
          unlockedAt: now,
        },
      });
    }

    const unlockedTotal = entries
      .filter((e) => e.expiresAt > now)
      .reduce((s, e) => s + e.amountPaise, 0);

    if (unlockedTotal > 0) {
      await syncProfileBalance(clientId, tx);
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { orderNumber: true },
      });
      await tx.cashbackLedgerEntry.create({
        data: {
          clientId,
          type: "EARNED",
          amountPaise: unlockedTotal,
          balanceAfterPaise: (
            await tx.clientProfile.findUnique({ where: { userId: clientId } })
          )?.cashbackBalancePaise ?? unlockedTotal,
          orderId,
          description: `Cashback unlocked after full payment — ${order?.orderNumber ?? orderId}`,
        },
      });
    }
  });
}

export async function computeOrderCashbackEarn(
  clientId: string,
  items: Array<{
    productId: string;
    variationId: string | null;
    totalPaise: number;
    quantity: number;
  }>,
  prefetchedRules?: CashbackRuleRow[]
) {
  const rules =
    prefetchedRules ??
    (await prisma.cashbackRule.findMany({
      where: { clientId, isActive: true },
      select: {
        productId: true,
        variationId: true,
        type: true,
        valuePaise: true,
        valueBps: true,
      },
    }));

  if (rules.length === 0) return 0;

  let earned = 0;
  for (const item of items) {
    earned += cashbackPaiseForLine(
      rules as CashbackRuleRow[],
      item.productId,
      item.variationId,
      item.totalPaise,
      item.quantity
    );
  }
  return earned;
}

/** Redeem available cashback (next bill, UPI, or Amazon voucher request). */
export async function redeemWalletCashback(
  clientId: string,
  amountPaise: number,
  type: CashbackRedemptionType,
  meta?: { upiId?: string; clientNote?: string }
) {
  if (amountPaise <= 0) throw new Error("Invalid redemption amount");
  if (type === CashbackRedemptionType.UPI && !meta?.upiId?.trim()) {
    throw new Error("UPI ID is required for UPI redemption");
  }

  return prisma.$transaction(async (tx) => {
    await expireDueWalletEntries(clientId, tx);
    const now = new Date();

    const available = await tx.cashbackWalletEntry.findMany({
      where: {
        clientId,
        status: CashbackWalletStatus.AVAILABLE,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "asc" },
    });

    const totalAvailable = available.reduce((s, e) => s + e.amountPaise, 0);
    if (amountPaise > totalAvailable) {
      throw new Error("Insufficient available cashback");
    }

    let remaining = amountPaise;
    for (const entry of available) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, entry.amountPaise);
      remaining -= take;

      if (take === entry.amountPaise) {
        await tx.cashbackWalletEntry.update({
          where: { id: entry.id },
          data: {
            status: CashbackWalletStatus.REDEEMED,
            redeemedAt: now,
            redemptionType: type,
          },
        });
      } else {
        await tx.cashbackWalletEntry.update({
          where: { id: entry.id },
          data: { amountPaise: entry.amountPaise - take },
        });
        await tx.cashbackWalletEntry.create({
          data: {
            clientId,
            amountPaise: take,
            status: CashbackWalletStatus.REDEEMED,
            source: CashbackWalletSource.ADMIN,
            earnedAt: entry.earnedAt,
            unlockedAt: entry.unlockedAt,
            expiresAt: entry.expiresAt,
            redeemedAt: now,
            redemptionType: type,
          },
        });
      }
    }

    await syncProfileBalance(clientId, tx);
    const balanceAfter =
      (await tx.clientProfile.findUnique({ where: { userId: clientId } }))
        ?.cashbackBalancePaise ?? 0;

    const ledgerType =
      type === CashbackRedemptionType.NEXT_BILL
        ? "REDEEMED_BILL"
        : type === CashbackRedemptionType.UPI
          ? "REDEEMED_UPI"
          : "REDEEMED_AMAZON";

    const description =
      type === CashbackRedemptionType.NEXT_BILL
        ? "Redeemed for next order"
        : type === CashbackRedemptionType.AMAZON_VOUCHER
          ? "Amazon gift card redemption requested"
          : `UPI cashback redemption requested — ${meta?.upiId}`;

    await tx.cashbackLedgerEntry.create({
      data: {
        clientId,
        type: ledgerType,
        amountPaise,
        balanceAfterPaise: balanceAfter,
        description,
      },
    });

    await tx.cashbackRedemption.create({
      data: {
        clientId,
        type,
        amountPaise,
        status: type === CashbackRedemptionType.NEXT_BILL ? "FULFILLED" : "PENDING",
        fulfilledAt: type === CashbackRedemptionType.NEXT_BILL ? now : null,
        upiId: meta?.upiId?.trim() || null,
        clientNote: meta?.clientNote?.trim() || null,
      },
    });

    return { redeemedPaise: amountPaise, balanceAfterPaise: balanceAfter };
  });
}

export async function approveCashbackRedemption(
  redemptionId: string,
  data: { paymentProof?: string; adminComment?: string; amazonCode?: string }
) {
  const redemption = await prisma.cashbackRedemption.findUnique({
    where: { id: redemptionId },
  });
  if (!redemption || redemption.status !== "PENDING") {
    throw new Error("Redemption not found or already processed");
  }

  await prisma.cashbackRedemption.update({
    where: { id: redemptionId },
    data: {
      status: "FULFILLED",
      fulfilledAt: new Date(),
      paymentProof: data.paymentProof ?? null,
      adminComment: data.adminComment ?? null,
      amazonCode: data.amazonCode ?? null,
    },
  });
}

export async function rejectCashbackRedemption(
  redemptionId: string,
  reason: string,
  adminComment?: string
) {
  if (!reason.trim()) throw new Error("Rejection reason is required");

  await prisma.$transaction(async (tx) => {
    const redemption = await tx.cashbackRedemption.findUnique({
      where: { id: redemptionId },
    });
    if (!redemption || redemption.status !== "PENDING") {
      throw new Error("Redemption not found or already processed");
    }

    const now = new Date();
    await tx.cashbackWalletEntry.create({
      data: {
        clientId: redemption.clientId,
        amountPaise: redemption.amountPaise,
        status: CashbackWalletStatus.AVAILABLE,
        source: CashbackWalletSource.ADMIN,
        earnedAt: now,
        unlockedAt: now,
        expiresAt: cashbackExpiryDate(now),
        adminNote: `Refund after rejected redemption`,
      },
    });

    await syncProfileBalance(redemption.clientId, tx);
    const balanceAfter =
      (await tx.clientProfile.findUnique({ where: { userId: redemption.clientId } }))
        ?.cashbackBalancePaise ?? 0;

    await tx.cashbackLedgerEntry.create({
      data: {
        clientId: redemption.clientId,
        type: "EARNED",
        amountPaise: redemption.amountPaise,
        balanceAfterPaise: balanceAfter,
        description: `Cashback refunded — redemption rejected: ${reason}`,
      },
    });

    await tx.cashbackRedemption.update({
      where: { id: redemptionId },
      data: {
        status: "CANCELLED",
        rejectionReason: reason,
        adminComment: adminComment ?? null,
      },
    });
  });
}

/** Spend available cashback at checkout (NEXT_BILL redemption inline). */
export async function applyCashbackAtCheckout(
  clientId: string,
  amountPaise: number,
  orderId: string,
  db: Prisma.TransactionClient
) {
  if (amountPaise <= 0) return;

  await expireDueWalletEntries(clientId, db);
  const now = new Date();
  const available = await db.cashbackWalletEntry.findMany({
    where: {
      clientId,
      status: CashbackWalletStatus.AVAILABLE,
      expiresAt: { gt: now },
    },
    orderBy: { expiresAt: "asc" },
  });

  const totalAvailable = available.reduce((s, e) => s + e.amountPaise, 0);
  if (amountPaise > totalAvailable) {
    throw new Error("Insufficient available cashback");
  }

  let remaining = amountPaise;
  for (const entry of available) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, entry.amountPaise);
    remaining -= take;

    if (take === entry.amountPaise) {
      await db.cashbackWalletEntry.update({
        where: { id: entry.id },
        data: {
          status: CashbackWalletStatus.REDEEMED,
          redeemedAt: now,
          redemptionType: CashbackRedemptionType.NEXT_BILL,
        },
      });
    } else {
      await db.cashbackWalletEntry.update({
        where: { id: entry.id },
        data: { amountPaise: entry.amountPaise - take },
      });
      await db.cashbackWalletEntry.create({
        data: {
          clientId,
          orderId,
          amountPaise: take,
          status: CashbackWalletStatus.REDEEMED,
          source: CashbackWalletSource.ORDER,
          earnedAt: entry.earnedAt,
          unlockedAt: entry.unlockedAt,
          expiresAt: entry.expiresAt,
          redeemedAt: now,
          redemptionType: CashbackRedemptionType.NEXT_BILL,
        },
      });
    }
  }

  await syncProfileBalance(clientId, db);
  await db.cashbackLedgerEntry.create({
    data: {
      clientId,
      type: "REDEEMED_BILL",
      amountPaise,
      balanceAfterPaise: (
        await db.clientProfile.findUnique({ where: { userId: clientId } })
      )?.cashbackBalancePaise ?? 0,
      orderId,
      description: "Cashback applied on order",
    },
  });
}
