import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { expireDueWalletEntries, getWalletBalances } from "@/lib/cashback-wallet";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { clientId } = await params;

  const [client, discounts, wallet, redemptions, ledger] = await Promise.all([
    prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        clientProfile: { select: { company: true, cashbackBalancePaise: true } },
      },
    }),
    prisma.productDiscountRule.findMany({
      where: { clientId },
      orderBy: { updatedAt: "desc" },
      include: {
        product: { select: { name: true } },
      },
    }),
    prisma.cashbackWalletEntry.findMany({
      where: { clientId },
      orderBy: { earnedAt: "desc" },
      include: { order: { select: { orderNumber: true } } },
    }),
    prisma.cashbackRedemption.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.cashbackLedgerEntry.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  await expireDueWalletEntries(clientId);
  const balances = await getWalletBalances(clientId);

  return NextResponse.json({
    client,
    balances,
    discounts,
    wallet,
    redemptions,
    ledger,
  });
}
