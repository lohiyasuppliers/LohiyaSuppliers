import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return apiError("Unauthorized", 401);
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING";

  const redemptions = await prisma.cashbackRedemption.findMany({
    where: {
      status: status as "PENDING" | "FULFILLED" | "CANCELLED",
      type: { in: ["UPI", "AMAZON_VOUCHER"] },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          clientProfile: { select: { company: true } },
        },
      },
    },
  });

  return apiOk({ redemptions });
}
