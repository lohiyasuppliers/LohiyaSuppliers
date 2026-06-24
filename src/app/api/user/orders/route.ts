import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== Role.CLIENT) {
    return apiError("Client login required", 401);
  }

  const orders = await prisma.order.findMany({
    where: { clientId: session.user.id },
    include: {
      items: {
        select: {
          productName: true,
          variationLabel: true,
          quantity: true,
          unitPricePaise: true,
          totalPaise: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiOk(orders);
}
