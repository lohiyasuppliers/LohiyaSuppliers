import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const { status, paymentStatus, rejectionReason } = body;

  const data: Record<string, unknown> = {};
  if (status) {
    data.status = status;
    if (status === "APPROVED") {
      data.approvedAt = new Date();
      data.approvedById = auth.session.user.id;
    }
    if (status === "REJECTED" && rejectionReason) {
      data.rejectionReason = rejectionReason;
    }
  }
  if (paymentStatus) data.paymentStatus = paymentStatus;

  const order = await prisma.order.update({ where: { id }, data });
  return NextResponse.json(order);
}
