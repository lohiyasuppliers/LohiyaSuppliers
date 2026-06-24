import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, parseJsonBody } from "@/lib/api";
import { Role } from "@prisma/client";
import { applyOrderPayment, type PaymentProofInput } from "@/lib/payable-orders";

/** Submit payment for admin verification (not marked paid until admin approves). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: Role }).role !== Role.CLIENT) {
    return apiError("Unauthorized", 401);
  }

  const clientId = (session.user as { id: string }).id;
  const { id } = await params;
  const body = await parseJsonBody<{
    amountPaise?: number;
    proof: PaymentProofInput;
  }>(req);

  if (!body?.proof) return apiError("Payment proof details required", 400);

  try {
    const paymentId = `SCANNER_DEMO_${Date.now()}`;
    const result = await applyOrderPayment(
      clientId,
      id,
      body.amountPaise ?? null,
      paymentId,
      body.proof
    );
    return NextResponse.json({
      ok: true,
      ...result,
      message: "Payment submitted. Awaiting admin verification.",
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Payment failed", 400);
  }
}
