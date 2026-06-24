import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { expireAllDueWalletEntries, sumWalletBalances } from "@/lib/cashback-wallet";
import { formatPaise } from "@/lib/utils";
import { CashbackWalletStatus } from "@prisma/client";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  await expireAllDueWalletEntries();

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: {
      id: true,
      name: true,
      email: true,
      clientProfile: { select: { company: true } },
      discountRules: {
        where: { isActive: true },
        select: { title: true, type: true, valuePaise: true, valueBps: true },
      },
      cashbackWallet: {
        where: {
          status: { in: [CashbackWalletStatus.LOCKED, CashbackWalletStatus.AVAILABLE] },
        },
        select: { amountPaise: true, status: true, expiresAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const lines = [
    "Client ID,Name,Email,Company,Active Discounts,Available Cashback,Locked Cashback",
  ];

  for (const c of clients) {
    const b = sumWalletBalances(c.cashbackWallet, now);
    const discounts = c.discountRules
      .map((d) =>
        d.type === "FIXED"
          ? `${d.title}:${formatPaise(d.valuePaise ?? 0)}`
          : `${d.title}:${(d.valueBps ?? 0) / 100}%`
      )
      .join("; ");

    lines.push(
      [
        c.id,
        `"${(c.name || "").replace(/"/g, '""')}"`,
        c.email,
        `"${(c.clientProfile?.company || "").replace(/"/g, '""')}"`,
        `"${discounts}"`,
        (b.availablePaise / 100).toFixed(2),
        (b.lockedPaise / 100).toFixed(2),
      ].join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="client-rewards.csv"',
    },
  });
}
