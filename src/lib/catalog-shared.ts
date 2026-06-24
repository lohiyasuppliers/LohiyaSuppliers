/** Browser-safe enums — do not import @prisma/client in client components. */

export const ApplicationType = {
  METAL: "METAL",
  WOOD: "WOOD",
  BOTH: "BOTH",
} as const;
export type ApplicationType = (typeof ApplicationType)[keyof typeof ApplicationType];

export const Role = {
  ADMIN: "ADMIN",
  CLIENT: "CLIENT",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const OrderStatus = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED_PAID: "APPROVED_PAID",
  APPROVED_UNPAID: "APPROVED_UNPAID",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const CategoryType = {
  PRODUCT: "PRODUCT",
  SERVICE: "SERVICE",
} as const;
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

export const OrderType = {
  PREPAID: "PREPAID",
  POSTPAID: "POSTPAID",
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const APPLICATION_LABELS: Record<ApplicationType, string> = {
  METAL: "Metal Application",
  WOOD: "Wood Application",
  BOTH: "All Applications",
};

export const APPLICATION_ROUTES = {
  all: "/products",
  metal: "/products?application=metal",
  wood: "/products?application=wood",
} as const;

export function parseApplicationParam(value?: string): ApplicationType | undefined {
  if (value === "metal") return ApplicationType.METAL;
  if (value === "wood") return ApplicationType.WOOD;
  return undefined;
}

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  application: ApplicationType;
  imageUrl: string | null;
  children: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    productCount: number;
  }[];
}
