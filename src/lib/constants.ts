/** Sentinel variation id for product-level overrides (pricing, cashback). */
export const PRODUCT_LEVEL_VARIATION_ID = "__product__";

export const ROLES = ["ADMIN", "CLIENT"] as const;
export type AppRole = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  "PENDING_APPROVAL",
  "APPROVED",
  "FULFILLED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const;

export const PAYMENT_STATUSES = ["UNPAID", "PAID", "FAILED", "REFUNDED"] as const;

export const ORDER_TYPES = ["PREPAID", "POSTPAID"] as const;

export const CATEGORY_TYPES = ["PRODUCT", "SERVICE"] as const;

export const VOUCHER_SCOPES = ["WHOLE_BILL", "PRODUCT", "SERVICE"] as const;

export const DEFAULT_PLATFORM_SETTINGS = {
  business_name: "Lohiya Suppliers",
  business_gstin: "",
  business_state: "Maharashtra",
  allow_voucher_cashback_stack: "true",
  contact_email: "info@lohiyasuppliers.com",
  contact_phone: "+91 98765 43210",
} as const;
