import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { expireAllDueWalletEntries, sumWalletBalances } from "@/lib/cashback-wallet";
import { buildCsv, csvDownloadResponse } from "@/lib/csv-export";
import { formatPaise } from "@/lib/utils";
import { clientCode } from "@/lib/export-format";
import { CashbackWalletStatus } from "@prisma/client";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  await expireAllDueWalletEntries();

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: {
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

  const headers = [
    "Client Code",
    "Name",
    "Email",
    "Company",
    "Active Discounts",
    "Available Cashback (INR)",
    "Locked Cashback (INR)",
  ];

  const now = new Date();
  const rows = clients.map((c, idx) => {
    const b = sumWalletBalances(c.cashbackWallet, now);
    const discounts = c.discountRules
      .map((d) =>
        d.type === "FIXED"
          ? `${d.title}: ${formatPaise(d.valuePaise ?? 0)}`
          : `${d.title}: ${(d.valueBps ?? 0) / 100}%`
      )
      .join(" | ");

    return [
      clientCode(c.email, idx),
      c.name || "",
      c.email,
      c.clientProfile?.company || "",
      discounts,
      (b.availablePaise / 100).toFixed(2),
      (b.lockedPaise / 100).toFixed(2),
    ];
  });

  return csvDownloadResponse(buildCsv(headers, rows), "client-rewards.csv");
}
