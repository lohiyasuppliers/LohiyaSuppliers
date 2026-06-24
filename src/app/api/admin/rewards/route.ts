import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import {
  expireAllDueWalletEntries,
  getWalletBalances,
  cashbackExpiryDate,
  sumWalletBalances,
} from "@/lib/cashback-wallet";
import { DEFAULT_CASHBACK_EXPIRY_DAYS } from "@/lib/discount-rules";
import {
  CashbackWalletSource,
  CashbackWalletStatus,
  Role,
} from "@prisma/client";
import { rupeesToPaise } from "@/lib/money";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  await expireAllDueWalletEntries();

  const clients = await prisma.user.findMany({
    where: { role: Role.CLIENT },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      clientProfile: { select: { company: true } },
      discountRules: { where: { isActive: true }, select: { id: true } },
      productDiscountRules: { where: { isActive: true }, select: { id: true } },
      cashbackWallet: {
        where: {
          status: { in: [CashbackWalletStatus.LOCKED, CashbackWalletStatus.AVAILABLE] },
        },
        select: { amountPaise: true, status: true, expiresAt: true },
      },
      _count: {
        select: {
          orders: true,
          cashbackRedemptions: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const rows = clients.map((c) => {
    const balances = sumWalletBalances(c.cashbackWallet, now);
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      company: c.clientProfile?.company ?? "—",
      isActive: c.isActive,
      discountRuleCount: c.productDiscountRules.length,
      availableCashbackPaise: balances.availablePaise,
      lockedCashbackPaise: balances.lockedPaise,
      orderCount: c._count.orders,
      redemptionCount: c._count.cashbackRedemptions,
    };
  });

  return NextResponse.json({ clients: rows });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const { action, clientId, entryId, amountRupees, expiresAt, adminNote, status } = body;

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  if (action === "grant") {
    const amountPaise = rupeesToPaise(Number(amountRupees));
    if (amountPaise <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const entry = await prisma.cashbackWalletEntry.create({
      data: {
        clientId,
        amountPaise,
        status: CashbackWalletStatus.AVAILABLE,
        source: CashbackWalletSource.ADMIN,
        unlockedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : cashbackExpiryDate(),
        adminNote: adminNote || "Admin grant",
      },
    });
    const balances = await getWalletBalances(clientId);
    await prisma.clientProfile.update({
      where: { userId: clientId },
      data: { cashbackBalancePaise: balances.availablePaise },
    });
    return NextResponse.json({ entry, balances });
  }

  if (action === "update_entry" && entryId) {
    const data: Record<string, unknown> = {};
    if (amountRupees != null) data.amountPaise = rupeesToPaise(Number(amountRupees));
    if (expiresAt) data.expiresAt = new Date(expiresAt);
    if (adminNote != null) data.adminNote = adminNote;
    if (status) data.status = status;
    if (status === CashbackWalletStatus.AVAILABLE) data.unlockedAt = new Date();

    const entry = await prisma.cashbackWalletEntry.update({
      where: { id: entryId },
      data,
    });
    const balances = await getWalletBalances(clientId);
    await prisma.clientProfile.update({
      where: { userId: clientId },
      data: { cashbackBalancePaise: balances.availablePaise },
    });
    return NextResponse.json({ entry, balances });
  }

  if (action === "delete_entry" && entryId) {
    await prisma.cashbackWalletEntry.delete({ where: { id: entryId } });
    const balances = await getWalletBalances(clientId);
    await prisma.clientProfile.update({
      where: { userId: clientId },
      data: { cashbackBalancePaise: balances.availablePaise },
    });
    return NextResponse.json({ success: true, balances });
  }

  if (action === "extend_all") {
    const days = Number(body.days) || DEFAULT_CASHBACK_EXPIRY_DAYS;
    const entries = await prisma.cashbackWalletEntry.findMany({
      where: {
        clientId,
        status: { in: [CashbackWalletStatus.LOCKED, CashbackWalletStatus.AVAILABLE] },
      },
    });
    await prisma.$transaction(
      entries.map((e) => {
        const newExpiry = new Date(e.expiresAt);
        newExpiry.setDate(newExpiry.getDate() + days);
        return prisma.cashbackWalletEntry.update({
          where: { id: e.id },
          data: { expiresAt: newExpiry },
        });
      })
    );
    return NextResponse.json({ extended: entries.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
