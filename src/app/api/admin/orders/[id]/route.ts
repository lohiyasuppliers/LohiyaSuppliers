import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import {
  approvePendingPayment,
  rejectPendingPayment,
  adminSettleOrderPayment,
  adminApproveOrder,
  adminRevertOrderApproval,
  paymentStateFromPaid,
} from "@/lib/payable-orders";
import { apiError } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const {
    status,
    paymentStatus,
    rejectionReason,
    approvePayment,
    rejectPayment,
    approveOrder,
    revertOrderApproval,
    adminComment,
    paidPaise: paidPaiseInput,
    trackingNumber,
    verify,
  } = body;

  if (approveOrder) {
    try {
      const order = await adminApproveOrder(id, auth.session.user.id, adminComment);
      return NextResponse.json(order);
    } catch (e) {
      return apiError(e instanceof Error ? e.message : "Order approval failed", 400);
    }
  }

  if (revertOrderApproval) {
    try {
      const order = await adminRevertOrderApproval(id);
      return NextResponse.json(order);
    } catch (e) {
      return apiError(e instanceof Error ? e.message : "Revert failed", 400);
    }
  }

  if (approvePayment) {
    try {
      const result = await approvePendingPayment(id, adminComment);
      return NextResponse.json(result);
    } catch (e) {
      return apiError(e instanceof Error ? e.message : "Approval failed", 400);
    }
  }

  if (rejectPayment) {
    try {
      const result = await rejectPendingPayment(id, adminComment || rejectionReason);
      return NextResponse.json(result);
    } catch (e) {
      return apiError(e instanceof Error ? e.message : "Rejection failed", 400);
    }
  }

  if (paidPaiseInput !== undefined && paidPaiseInput !== null) {
    try {
      const amount = Number(paidPaiseInput);
      if (!Number.isFinite(amount) || amount < 0) {
        return apiError("Invalid settled amount", 400);
      }
      const order = await adminSettleOrderPayment(id, amount);
      return NextResponse.json(order);
    } catch (e) {
      return apiError(e instanceof Error ? e.message : "Settlement update failed", 400);
    }
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return apiError("Order not found", 404);

  const data: Record<string, unknown> = {};

  if (verify === true) {
    data.isVerified = true;
    data.verifiedAt = new Date();
    data.verifiedById = auth.session.user.id;
  }

  if (trackingNumber !== undefined) {
    data.trackingNumber = trackingNumber || null;
  }

  if (status) {
    data.status = status;
    if (status === OrderStatus.APPROVED_PAID) {
      data.approvedAt = new Date();
      data.approvedById = auth.session.user.id;
      if (existing.pendingPaymentPaise <= 0) {
        data.paidPaise = existing.totalPaise;
        data.paymentStatus = PaymentStatus.PAID;
      }
    } else if (status === OrderStatus.APPROVED_UNPAID) {
      data.approvedAt = new Date();
      data.approvedById = auth.session.user.id;
      if (existing.pendingPaymentPaise <= 0) {
        const { paymentStatus: ps } = paymentStateFromPaid(
          existing.totalPaise,
          existing.paidPaise
        );
        data.paymentStatus = ps;
      }
    } else if (status === OrderStatus.REJECTED && rejectionReason) {
      data.rejectionReason = rejectionReason;
    }
  }

  if (paymentStatus && paidPaiseInput === undefined) {
    if (existing.pendingPaymentPaise > 0) {
      return apiError(
        "Approve or reject the client's pending payment before changing payment status",
        400
      );
    }

    if (paymentStatus === PaymentStatus.PAID) {
      data.paidPaise = existing.totalPaise;
      data.pendingPaymentPaise = 0;
      data.paymentStatus = PaymentStatus.PAID;
      data.status = OrderStatus.APPROVED_PAID;
    } else if (paymentStatus === PaymentStatus.UNPAID) {
      data.paidPaise = 0;
      data.pendingPaymentPaise = 0;
      data.paymentStatus = PaymentStatus.UNPAID;
    } else if (paymentStatus === PaymentStatus.PARTIAL) {
      if (existing.paidPaise <= 0 || existing.paidPaise >= existing.totalPaise) {
        return apiError("Set a settled amount first, then status becomes Partially Settled", 400);
      }
      data.paymentStatus = PaymentStatus.PARTIAL;
      data.status = OrderStatus.APPROVED_UNPAID;
    } else {
      data.paymentStatus = paymentStatus;
    }
  }

  if (Object.keys(data).length === 0) {
    return apiError("No changes provided", 400);
  }

  const order = await prisma.order.update({ where: { id }, data });
  return NextResponse.json(order);
}
