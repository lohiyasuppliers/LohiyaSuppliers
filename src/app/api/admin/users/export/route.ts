import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { formatDate, formatPaise } from "@/lib/utils";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const userId = new URL(req.url).searchParams.get("userId");

  const users = await prisma.user.findMany({
    where: { role: Role.CLIENT, ...(userId ? { id: userId } : {}) },
    include: {
      clientProfile: true,
      _count: { select: { orders: true } },
      orders: {
        where: { paymentStatus: "PAID" },
        select: { totalPaise: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "ID",
    "Name",
    "Email",
    "Phone",
    "Company",
    "GSTIN",
    "Billing State",
    "Address",
    "City",
    "Pincode",
    "Status",
    "Orders",
    "Total Spent",
    "Joined",
  ];

  const rows = users.map((u) => {
    const totalSpent = u.orders.reduce((s, o) => s + o.totalPaise, 0);
    return [
      u.id,
      u.name || "",
      u.email,
      u.phone || "",
      u.clientProfile?.company || "",
      u.clientProfile?.gstin || "",
      u.clientProfile?.billingState || "",
      u.clientProfile?.address || "",
      u.clientProfile?.city || "",
      u.clientProfile?.pincode || "",
      u.isActive ? "Active" : "Inactive",
      u._count.orders,
      formatPaise(totalSpent).replace("₹", ""),
      formatDate(u.createdAt),
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="lohiya-clients-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
