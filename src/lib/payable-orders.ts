/** Server-side helpers for client payable orders and partial payments. */
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { orderBalancePaise, paymentStateFromPaid } from "./order-money";
import { creditCashbackForOrder } from "./cashback-rules";

export { orderBalancePaise, paymentStateFromPaid } from "./order-money";

export type PaymentProofInput = {
  screenshot?: string;
};

export function isValidPaymentProof(proof?: PaymentProofInput): boolean {
  return !!proof?.screenshot?.startsWith("data:image/");
}

export type PayableOrder = {
  id: string;
  orderNumber: string;
  totalPaise: number;
  paidPaise: number;
  pendingPaymentPaise: number;
  balancePaise: number;
  createdAt: Date;
};

export function canPayOrder(order: {
  status: OrderStatus;
  totalPaise: number;
  paidPaise: number;
  pendingPaymentPaise?: number;
}) {
  return (
    order.status === OrderStatus.APPROVED_UNPAID &&
    orderBalancePaise(order) > 0 &&
    (order.pendingPaymentPaise ?? 0) === 0
  );
}

export async function getPayableOrders(clientId: string): Promise<PayableOrder[]> {
  const orders = await prisma.order.findMany({
    where: {
      clientId,
      pendingPaymentPaise: 0,
      status: OrderStatus.APPROVED_UNPAID,
      paymentStatus: { not: PaymentStatus.PAID },
    },
    select: {
      id: true,
      orderNumber: true,
      totalPaise: true,
      paidPaise: true,
      pendingPaymentPaise: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return orders
    .map((o) => ({
      ...o,
      balancePaise: orderBalancePaise(o),
    }))
    .filter((o) => o.balancePaise > 0);
}

export async function getPendingVerificationOrders(clientId: string) {
  return prisma.order.findMany({
    where: {
      clientId,
      pendingPaymentPaise: { gt: 0 },
      paymentStatus: PaymentStatus.PENDING_VERIFICATION,
    },
    select: {
      id: true,
      orderNumber: true,
      totalPaise: true,
      pendingPaymentPaise: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export function summarizePayable(orders: PayableOrder[]) {
  const totalDuePaise = orders.reduce((s, o) => s + o.balancePaise, 0);
  const totalOrderValuePaise = orders.reduce((s, o) => s + o.totalPaise, 0);
  const totalPaidPaise = orders.reduce((s, o) => s + o.paidPaise, 0);
  return { totalDuePaise, totalOrderValuePaise, totalPaidPaise, orderCount: orders.length };
}

function buildProofJson(paymentId: string, amountPaise: number, proof: PaymentProofInput) {
  return JSON.stringify({
    paymentId,
    amountPaise,
    screenshot: proof.screenshot ?? null,
    submittedAt: new Date().toISOString(),
  });
}

/** Submit payment for admin verification (does not mark as paid until admin approves). */
export async function applyClientPayment(
  clientId: string,
  amountPaise: number,
  paymentId: string,
  proof: PaymentProofInput
) {
  if (amountPaise < 1) throw new Error("Invalid payment amount");
  if (!isValidPaymentProof(proof)) {
    throw new Error("Payment screenshot is required");
  }

  return prisma.$transaction(async (tx) => {
    const orders = await tx.order.findMany({
      where: {
        clientId,
        status: OrderStatus.APPROVED_UNPAID,
        pendingPaymentPaise: 0,
      },
      orderBy: { createdAt: "asc" },
    });

    let remaining = amountPaise;
    const allocations: { orderNumber: string; amountPaise: number }[] = [];

    for (const order of orders) {
      if (remaining <= 0) break;
      const due = orderBalancePaise(order);
      if (due <= 0) continue;

      const alloc = Math.min(remaining, due);

      await tx.order.update({
        where: { id: order.id },
        data: {
          pendingPaymentPaise: alloc,
          paymentStatus: PaymentStatus.PENDING_VERIFICATION,
          paymentProof: buildProofJson(paymentId, alloc, proof),
          razorpayPaymentId: paymentId,
        },
      });

      allocations.push({ orderNumber: order.orderNumber, amountPaise: alloc });
      remaining -= alloc;
    }

    if (allocations.length === 0) {
      throw new Error("No payable orders found");
    }

    return {
      paymentId,
      amountPaise: amountPaise - remaining,
      allocations,
      awaitingAdmin: true,
    };
  });
}

/** Submit payment toward a single order for admin verification. */
export async function applyOrderPayment(
  clientId: string,
  orderId: string,
  amountPaise: number | null,
  paymentId: string,
  proof: PaymentProofInput
) {
  if (!isValidPaymentProof(proof)) {
    throw new Error("Payment screenshot is required");
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, clientId },
    });
    if (!order) throw new Error("Order not found");
    if (order.status !== OrderStatus.APPROVED_UNPAID) {
      throw new Error("This order is not awaiting payment");
    }
    if (order.pendingPaymentPaise > 0) {
      throw new Error("A payment is already awaiting admin verification for this order");
    }

    const due = orderBalancePaise(order);
    if (due <= 0) throw new Error("No balance due on this order");

    const payAmount = amountPaise == null ? due : Math.min(amountPaise, due);
    if (payAmount < 1) throw new Error("Invalid payment amount");

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        pendingPaymentPaise: payAmount,
        paymentStatus: PaymentStatus.PENDING_VERIFICATION,
        paymentProof: buildProofJson(paymentId, payAmount, proof),
        razorpayPaymentId: paymentId,
      },
    });

    return {
      orderNumber: updated.orderNumber,
      submittedPaise: payAmount,
      awaitingAdmin: true,
      paymentId,
    };
  });
}

/** Admin: orders with client-submitted payments awaiting verification. */
export async function getAdminPendingPayments() {
  return prisma.order.findMany({
    where: {
      pendingPaymentPaise: { gt: 0 },
      paymentStatus: PaymentStatus.PENDING_VERIFICATION,
    },
    select: {
      id: true,
      orderNumber: true,
      totalPaise: true,
      paidPaise: true,
      pendingPaymentPaise: true,
      paymentProof: true,
      createdAt: true,
      updatedAt: true,
      client: {
        select: {
          name: true,
          email: true,
          clientProfile: { select: { company: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** Orders awaiting admin approval (pay-later flow). */
export async function getAdminPendingOrderApprovals() {
  return prisma.order.findMany({
    where: { status: OrderStatus.PENDING_APPROVAL },
    select: {
      id: true,
      orderNumber: true,
      totalPaise: true,
      createdAt: true,
      client: {
        select: {
          name: true,
          email: true,
          clientProfile: { select: { company: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

/** Admin approves submitted amount only — remainder stays due on client account. */
export async function approvePendingPayment(orderId: string, adminComment?: string) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.pendingPaymentPaise <= 0) {
      throw new Error("No pending payment to approve");
    }

    const approvedPaise = order.pendingPaymentPaise;
    const newPaid = order.paidPaise + approvedPaise;
    const { paymentStatus, fullyPaid } = paymentStateFromPaid(order.totalPaise, newPaid);
    const remainingDue = Math.max(0, order.totalPaise - newPaid);

    let paymentProof = order.paymentProof;
    if (adminComment?.trim()) {
      try {
        const existing = order.paymentProof ? JSON.parse(order.paymentProof) : {};
        paymentProof = JSON.stringify({
          ...existing,
          adminComment: adminComment.trim(),
          approvedAt: new Date().toISOString(),
        });
      } catch {
        paymentProof = JSON.stringify({
          adminComment: adminComment.trim(),
          approvedAt: new Date().toISOString(),
        });
      }
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        paidPaise: newPaid,
        pendingPaymentPaise: 0,
        paymentStatus,
        status: fullyPaid ? OrderStatus.APPROVED_PAID : OrderStatus.APPROVED_UNPAID,
        adminComment: adminComment?.trim() || null,
        paymentProof,
      },
    });

    return {
      ...updated,
      approvedPaise,
      remainingDue,
      fullyPaid,
    };
  });

  if (result.fullyPaid) {
    await creditCashbackForOrder(orderId);
  }

  return result;
}

/** Admin manually sets how much has been settled on an order. */
export async function adminSettleOrderPayment(orderId: string, paidPaise: number) {
  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    if (order.pendingPaymentPaise > 0) {
      throw new Error("Approve or reject the client's pending payment before editing settlement");
    }

    const settled = Math.min(order.totalPaise, Math.max(0, Math.round(paidPaise)));
    const { paymentStatus, fullyPaid } = paymentStateFromPaid(order.totalPaise, settled);

    const row = await tx.order.update({
      where: { id: orderId },
      data: {
        paidPaise: settled,
        pendingPaymentPaise: 0,
        paymentStatus,
        status: fullyPaid ? OrderStatus.APPROVED_PAID : OrderStatus.APPROVED_UNPAID,
      },
    });

    return { ...row, fullyPaid };
  });

  if (updated.fullyPaid) {
    await creditCashbackForOrder(orderId);
  }

  return updated;
}

/** Admin approves a pay-later order so client can pay. */
export async function adminApproveOrder(
  orderId: string,
  adminUserId: string,
  adminComment?: string
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    if (order.status !== OrderStatus.PENDING_APPROVAL) {
      throw new Error("Only pending orders can be approved");
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.APPROVED_UNPAID,
        paymentStatus: PaymentStatus.UNPAID,
        approvedAt: new Date(),
        approvedById: adminUserId,
        paidPaise: 0,
        pendingPaymentPaise: 0,
        adminComment: adminComment?.trim() || null,
      },
    });
  });
}

/** Undo order approval — only when no payments recorded yet. */
export async function adminRevertOrderApproval(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    if (order.status !== OrderStatus.APPROVED_UNPAID) {
      throw new Error("Can only revert orders that are approved and unpaid");
    }
    if (order.paidPaise > 0) {
      throw new Error("Reset settlement to ₹0 before reverting order approval");
    }
    if (order.pendingPaymentPaise > 0) {
      throw new Error("Reject the pending client payment before reverting order approval");
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PENDING_APPROVAL,
        paymentStatus: PaymentStatus.UNPAID,
        approvedAt: null,
        approvedById: null,
      },
    });
  });
}

/** Admin rejects a submitted payment — client can pay again. */
export async function rejectPendingPayment(orderId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.pendingPaymentPaise <= 0) {
      throw new Error("No pending payment to reject");
    }

    const rejectedPaise = order.pendingPaymentPaise;
    const { paymentStatus } = paymentStateFromPaid(order.totalPaise, order.paidPaise);

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        pendingPaymentPaise: 0,
        paymentStatus,
        rejectionReason: reason?.trim() || null,
        adminComment: reason?.trim() || null,
        paymentProof: JSON.stringify({
          rejectedAt: new Date().toISOString(),
          rejectedAmountPaise: rejectedPaise,
          reason: reason?.trim() || null,
        }),
      },
    });

    return { ...updated, rejectedPaise };
  });
}
