/** Pure order amount helpers — safe for client and server. */
import { PaymentStatus } from "@prisma/client";

export function orderBalancePaise(order: {
  totalPaise: number;
  paidPaise: number;
  pendingPaymentPaise?: number | null;
}) {
  const pending = order.pendingPaymentPaise ?? 0;
  return Math.max(0, order.totalPaise - order.paidPaise - pending);
}

export function paymentStateFromPaid(totalPaise: number, paidPaise: number) {
  if (paidPaise <= 0) {
    return { paymentStatus: PaymentStatus.UNPAID as PaymentStatus, fullyPaid: false };
  }
  if (paidPaise >= totalPaise) {
    return { paymentStatus: PaymentStatus.PAID as PaymentStatus, fullyPaid: true };
  }
  return { paymentStatus: PaymentStatus.PARTIAL as PaymentStatus, fullyPaid: false };
}
