import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { Role } from "@prisma/client";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const users = await prisma.user.findMany({
    include: {
      clientProfile: true,
      _count: { select: { orders: true } },
      orders: { where: { paymentStatus: "PAID" }, select: { totalPaise: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    users.map((u) => ({
      ...u,
      password: undefined,
      totalSpentPaise: u.orders.reduce((s, o) => s + o.totalPaise, 0),
    }))
  );
}
