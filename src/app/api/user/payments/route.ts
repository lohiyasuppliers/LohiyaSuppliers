import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, parseJsonBody } from "@/lib/api";
import { Role } from "@prisma/client";
import { applyClientPayment, getPayableOrders, summarizePayable, type PaymentProofInput } from "@/lib/payable-orders";
import { PaymentStatus } from "@prisma/client";

/** Aggregate payment submission for admin verification (FIFO). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: Role }).role !== Role.CLIENT) {
    return apiError("Unauthorized", 401);
  }

  const clientId = (session.user as { id: string }).id;
  const body = await parseJsonBody<{
    amountPaise: number;
    proof: PaymentProofInput;
  }>(req);
  if (!body?.amountPaise || body.amountPaise < 100) {
    return apiError("Minimum payment is ₹1", 400);
  }
  if (!body.proof) return apiError("Payment proof details required", 400);

  const payable = await getPayableOrders(clientId);
  const { totalDuePaise } = summarizePayable(payable);
  if (totalDuePaise <= 0) return apiError("No pending balance", 400);
  if (body.amountPaise > totalDuePaise) {
    return apiError(`Amount exceeds pending balance of ₹${(totalDuePaise / 100).toLocaleString("en-IN")}`, 400);
  }

  try {
    const paymentId = `SCANNER_DEMO_${Date.now()}`;
    const result = await applyClientPayment(clientId, body.amountPaise, paymentId, body.proof);
    return NextResponse.json({
      ok: true,
      ...result,
      message: "Payment submitted. Awaiting admin verification.",
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Payment failed", 400);
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: Role }).role !== Role.CLIENT) {
    return apiError("Unauthorized", 401);
  }

  const clientId = (session.user as { id: string }).id;
  const orders = await getPayableOrders(clientId);
  return NextResponse.json({ ...summarizePayable(orders), orders });
}
