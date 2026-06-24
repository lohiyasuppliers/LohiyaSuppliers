import { formatDateTime } from "./utils";
import { formatPaise } from "./money";
import { getOrderStatusLabel } from "./constants";
import { orderBalancePaise } from "./payable-orders";

export interface OrderBillLineItem {
  index: number;
  productName: string;
  variationLabel: string | null;
  hsnCode: string;
  gstRatePercent: string;
  quantity: number;
  unitPricePaise: number;
  taxablePaise: number;
  taxPaise: number;
  lineTotalPaise: number;
}

export interface OrderBillData {
  billNumber: string;
  orderNumber: string;
  orderDate: string;
  orderTime: string;
  orderStatus: string;
  paymentStatus: string;
  orderType: string;
  notes: string | null;
  seller: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
    state: string;
  };
  buyer: {
    name: string;
    company: string;
    email: string;
    phone: string;
    gstin: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: OrderBillLineItem[];
  subtotalPaise: number;
  taxPaise: number;
  discountPaise: number;
  voucherDiscountPaise: number;
  cashbackAppliedPaise: number;
  totalPaise: number;
  paidPaise: number;
  balancePaise: number;
  generatedAt: string;
}

type ShippingAddress = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
};

type OrderForBill = {
  orderNumber: string;
  createdAt: Date;
  status: string;
  paymentStatus: string;
  orderType: string;
  notes: string | null;
  subtotalPaise: number;
  taxPaise: number;
  discountPaise: number;
  voucherDiscountPaise: number;
  cashbackAppliedPaise: number;
  totalPaise: number;
  paidPaise: number;
  shippingAddress: unknown;
  items: {
    productName: string;
    variationLabel: string | null;
    hsnCode: string;
    gstRateBps: number;
    quantity: number;
    unitPricePaise: number;
    totalPaise: number;
  }[];
};

export function buildOrderBill(
  order: OrderForBill,
  seller: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
    state: string;
  }
): OrderBillData {
  const addr = (order.shippingAddress ?? {}) as ShippingAddress;
  const dt = new Date(order.createdAt);

  const items: OrderBillLineItem[] = order.items.map((item, i) => {
    const taxPaise = Math.round((item.totalPaise * item.gstRateBps) / 10000);
    return {
      index: i + 1,
      productName: item.productName,
      variationLabel: item.variationLabel,
      hsnCode: item.hsnCode || "—",
      gstRatePercent: (item.gstRateBps / 100).toFixed(2),
      quantity: item.quantity,
      unitPricePaise: item.unitPricePaise,
      taxablePaise: item.totalPaise,
      taxPaise,
      lineTotalPaise: item.totalPaise + taxPaise,
    };
  });

  const balancePaise = orderBalancePaise(order);

  return {
    billNumber: `BILL-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    orderDate: dt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    orderTime: dt.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    orderStatus: getOrderStatusLabel(order.status),
    paymentStatus:
      order.paymentStatus === "PARTIAL"
        ? "Partially Paid"
        : order.paymentStatus.replace(/_/g, " "),
    orderType: order.orderType.replace(/_/g, " "),
    notes: order.notes,
    seller,
    buyer: {
      name: addr.name || "—",
      company: addr.company || "—",
      email: addr.email || "—",
      phone: addr.phone || "—",
      gstin: addr.gstin || "—",
      address: addr.address || "—",
      city: addr.city || "—",
      state: addr.state || "—",
      pincode: addr.pincode || "—",
      country: addr.country || "India",
    },
    items,
    subtotalPaise: order.subtotalPaise,
    taxPaise: order.taxPaise,
    discountPaise: order.discountPaise,
    voucherDiscountPaise: order.voucherDiscountPaise,
    cashbackAppliedPaise: order.cashbackAppliedPaise,
    totalPaise: order.totalPaise,
    paidPaise: order.paidPaise,
    balancePaise,
    generatedAt: formatDateTime(new Date()),
  };
}
