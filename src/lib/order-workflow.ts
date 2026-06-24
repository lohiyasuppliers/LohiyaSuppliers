import { orderBalancePaise } from "./order-money";

export type WorkflowStepId =
  | "placed"
  | "order_approved"
  | "payment_submitted"
  | "payment_approved"
  | "fully_settled";

export interface OrderWorkflowState {
  step: WorkflowStepId;
  stepIndex: number;
  label: string;
  description: string;
  clientMessage: string;
  canApproveOrder: boolean;
  canApprovePayment: boolean;
  canClientPay: boolean;
  canEditSettlement: boolean;
  canRevertOrderApproval: boolean;
  balanceDue: number;
}

const STEPS: { id: WorkflowStepId; label: string }[] = [
  { id: "placed", label: "Order placed" },
  { id: "order_approved", label: "Order approved" },
  { id: "payment_submitted", label: "Payment submitted" },
  { id: "payment_approved", label: "Payment approved" },
  { id: "fully_settled", label: "Fully settled" },
];

export function getWorkflowSteps() {
  return STEPS;
}

export function getOrderWorkflowState(order: {
  status: string;
  paymentStatus: string;
  totalPaise: number;
  paidPaise: number;
  pendingPaymentPaise?: number | null;
}): OrderWorkflowState {
  const pending = order.pendingPaymentPaise ?? 0;
  const balanceDue = orderBalancePaise(order);

  if (order.status === "PENDING_APPROVAL") {
    return {
      step: "placed",
      stepIndex: 0,
      label: "Awaiting order approval",
      description: "Client placed a pay-later order. Approve the order so they can make payment.",
      clientMessage: "Your order is waiting for admin approval. You can pay once approved.",
      canApproveOrder: true,
      canApprovePayment: false,
      canClientPay: false,
      canEditSettlement: false,
      canRevertOrderApproval: false,
      balanceDue: order.totalPaise,
    };
  }

  if (pending > 0 && order.paymentStatus === "PENDING_VERIFICATION") {
    return {
      step: "payment_submitted",
      stepIndex: 2,
      label: "Payment awaiting verification",
      description: `Client submitted ${pending / 100} rupees. Approve only that amount — not the full bill unless it matches the balance.`,
      clientMessage: "Your payment is submitted and waiting for admin verification.",
      canApproveOrder: false,
      canApprovePayment: true,
      canClientPay: false,
      canEditSettlement: false,
      canRevertOrderApproval: false,
      balanceDue,
    };
  }

  if (
    order.paymentStatus === "PAID" ||
    (order.paidPaise >= order.totalPaise && order.totalPaise > 0)
  ) {
    return {
      step: "fully_settled",
      stepIndex: 4,
      label: "Fully settled",
      description: "This order is fully paid. You can mark it completed when delivered.",
      clientMessage: "This order is fully paid. Thank you!",
      canApproveOrder: false,
      canApprovePayment: false,
      canClientPay: false,
      canEditSettlement: true,
      canRevertOrderApproval: false,
      balanceDue: 0,
    };
  }

  if (order.paidPaise > 0 && balanceDue > 0) {
    return {
      step: "payment_approved",
      stepIndex: 3,
      label: "Partially settled",
      description: `₹${order.paidPaise / 100} approved so far. Client can pay the remaining ₹${balanceDue / 100}.`,
      clientMessage: `Partial payment approved. Remaining balance: ₹${(balanceDue / 100).toLocaleString("en-IN")}.`,
      canApproveOrder: false,
      canApprovePayment: false,
      canClientPay: true,
      canEditSettlement: true,
      canRevertOrderApproval: false,
      balanceDue,
    };
  }

  if (order.status === "APPROVED_UNPAID") {
    return {
      step: "order_approved",
      stepIndex: 1,
      label: "Ready for client payment",
      description: "Order is approved. Client can pay full or partial amount from their dashboard.",
      clientMessage: "Order approved. Please pay from your account dashboard.",
      canApproveOrder: false,
      canApprovePayment: false,
      canClientPay: true,
      canEditSettlement: true,
      canRevertOrderApproval: order.paidPaise === 0 && pending === 0,
      balanceDue,
    };
  }

  return {
    step: "order_approved",
    stepIndex: 1,
    label: getOrderStatusLabel(order.status),
    description: "Review payment and order status below.",
    clientMessage: "Check your orders page for payment options.",
    canApproveOrder: false,
    canApprovePayment: false,
    canClientPay: balanceDue > 0,
    canEditSettlement: pending === 0,
    canRevertOrderApproval: false,
    balanceDue,
  };
}

function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING_APPROVAL: "Pending approval",
    APPROVED_UNPAID: "Approved — unpaid",
    APPROVED_PAID: "Approved — paid",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };
  return labels[status] ?? status;
}
