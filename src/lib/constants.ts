/** Sentinel variation id for product-level overrides (pricing, cashback). */
export const PRODUCT_LEVEL_VARIATION_ID = "__product__";

export const ROLES = ["ADMIN", "CLIENT"] as const;
export type AppRole = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  "PENDING_APPROVAL",
  "APPROVED_PAID",
  "APPROVED_UNPAID",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const;

export const ORDER_STATUS_LABELS: Record<(typeof ORDER_STATUSES)[number], string> = {
  PENDING_APPROVAL: "Pending Approval",
  APPROVED_PAID: "Approved (Paid)",
  APPROVED_UNPAID: "Approved (Unpaid)",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status.replace(/_/g, " ");
}

export const PAYMENT_STATUSES = ["UNPAID", "PARTIAL", "PAID", "PENDING_VERIFICATION", "FAILED", "REFUNDED"] as const;

/** User-facing payment labels — never show raw PAID until admin verifies. */
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    UNPAID: "Unpaid",
    PARTIAL: "Partially Settled",
    PAID: "Settled",
    PENDING_VERIFICATION: "Awaiting Admin Verification",
    FAILED: "Failed",
    REFUNDED: "Refunded",
  };
  return labels[status] ?? status.replace(/_/g, " ");
}

export const ORDER_TYPES = ["PREPAID", "POSTPAID"] as const;

export const CATEGORY_TYPES = ["PRODUCT", "SERVICE"] as const;

export const VOUCHER_SCOPES = ["WHOLE_BILL", "PRODUCT", "SERVICE"] as const;

export const COMPANY_PHONES = [
  { number: "7062099524", name: "Shivam" },
  { number: "9314526796", name: "Sunil" },
] as const;

export function formatCompanyPhones() {
  return COMPANY_PHONES.map((p) => `${p.number} (${p.name})`).join(", ");
}

export const DEFAULT_GST_RATE_BPS = 1800; // 18%
export const DEFAULT_GST_RATE_PERCENT = DEFAULT_GST_RATE_BPS / 100;

export const DEFAULT_PLATFORM_SETTINGS = {
  business_name: "Lohiya Suppliers",
  business_gstin: "",
  business_state: "Rajasthan",
  business_address:
    "145 Ram Nagar Shopping Center, Shastri Nagar, Jaipur 302016, Rajasthan",
  allow_voucher_cashback_stack: "true",
  contact_email: "lohiyasuppliers@gmail.com",
  contact_phone: "7062099524 (Shivam), 9314526796 (Sunil)",
} as const;
