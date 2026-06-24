import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, apiOk, parseJsonBody } from "@/lib/api";
import { buildCheckoutQuote } from "@/lib/checkout-totals";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== Role.CLIENT) {
    return apiError("Client login required", 401);
  }

  const body = await parseJsonBody<{
    items: Array<{ productId: string; variationId?: string; quantity: number }>;
    useCashback?: boolean;
    useDiscount?: boolean;
    applyCashbackPaise?: number;
    useWalletBalance?: boolean;
  }>(req);

  if (!body?.items?.length) return apiError("No items");

  try {
    const quote = await buildCheckoutQuote(session.user.id, body.items, {
      useDiscount: body.useDiscount,
      useCashback: body.useCashback,
      applyCashbackPaise: body.applyCashbackPaise,
      useWalletBalance: body.useWalletBalance,
    });
    return apiOk(quote);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to quote checkout", 400);
  }
}
