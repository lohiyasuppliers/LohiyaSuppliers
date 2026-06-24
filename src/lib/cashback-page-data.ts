import { prisma } from "./prisma";
import {
  expireDueWalletEntries,
  getWalletBalances,
} from "./cashback-wallet";

async function fetchRedemptions(clientId: string) {
  const fullSelect = {
    id: true,
    type: true,
    amountPaise: true,
    status: true,
    upiId: true,
    clientNote: true,
    adminComment: true,
    paymentProof: true,
    rejectionReason: true,
    amazonCode: true,
    createdAt: true,
    fulfilledAt: true,
  } as const;

  try {
    return await prisma.cashbackRedemption.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: fullSelect,
    });
  } catch {
    return prisma.cashbackRedemption.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        amountPaise: true,
        status: true,
        clientNote: true,
        amazonCode: true,
        createdAt: true,
        fulfilledAt: true,
      },
    });
  }
}

export async function fetchCashbackWalletData(clientId: string) {
  await expireDueWalletEntries(clientId);

  const [balances, profile, wallet, ledger, redemptions] = await Promise.all([
    getWalletBalances(clientId),
    prisma.clientProfile.findUnique({
      where: { userId: clientId },
      select: { cashbackBalancePaise: true },
    }),
    prisma.cashbackWalletEntry.findMany({
      where: { clientId },
      orderBy: { earnedAt: "desc" },
      take: 30,
      include: { order: { select: { orderNumber: true } } },
    }),
    prisma.cashbackLedgerEntry.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    fetchRedemptions(clientId),
  ]);

  const availablePaise = Math.max(
    balances.availablePaise,
    profile?.cashbackBalancePaise ?? 0
  );

  return {
    availablePaise,
    lockedPaise: balances.lockedPaise,
    balancePaise: availablePaise,
    wallet: wallet.map((w) => ({
      ...w,
      earnedAt: w.earnedAt.toISOString(),
      expiresAt: w.expiresAt.toISOString(),
    })),
    ledger: ledger.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
    redemptions: redemptions.map((r) => ({
      id: r.id,
      type: r.type,
      amountPaise: r.amountPaise,
      status: r.status,
      upiId: "upiId" in r ? (r.upiId as string | null) : null,
      clientNote: r.clientNote ?? null,
      adminComment: "adminComment" in r ? (r.adminComment as string | null) : null,
      paymentProof: "paymentProof" in r ? (r.paymentProof as string | null) : null,
      rejectionReason: "rejectionReason" in r ? (r.rejectionReason as string | null) : null,
      amazonCode: r.amazonCode ?? null,
      createdAt: r.createdAt.toISOString(),
      fulfilledAt: r.fulfilledAt?.toISOString() ?? null,
    })),
  };
}
