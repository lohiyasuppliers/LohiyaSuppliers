import { ORDER_STATUSES, PAYMENT_STATUSES } from "./constants";

export { ORDER_STATUSES, PAYMENT_STATUSES };

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING_APPROVAL: "bg-amber-100 text-amber-800",
    APPROVED: "bg-blue-100 text-blue-800",
    FULFILLED: "bg-indigo-100 text-indigo-800",
    COMPLETED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    UNPAID: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-orange-100 text-orange-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
