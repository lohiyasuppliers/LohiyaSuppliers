import { formatDateTime } from "./utils";

export interface InvoiceLineItem {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ProformaInvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  orderDate: string;
  orderTime: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    company: string;
    companyId: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    gstNumber: string;
  };
  seller: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstNumber: string;
  };
  items: InvoiceLineItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  generatedAt: string;
}

export function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `PF-${year}-${random}`;
}

type OrderWithRelations = {
  orderNumber: string;
  createdAt: Date;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string | null;
  paymentStatus: string;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
    company: string | null;
    companyId: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode: string | null;
    gstNumber: string | null;
  } | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  items: {
    quantity: number;
    price: number;
    total: number;
    product: { name: string; sku: string };
  }[];
};

export function buildProformaSnapshot(
  order: OrderWithRelations,
  invoiceNumber: string,
  seller: { name: string; address: string; phone: string; email: string; gstNumber: string }
): ProformaInvoiceData {
  const dt = new Date(order.createdAt);
  const user = order.user;

  return {
    invoiceNumber,
    orderNumber: order.orderNumber,
    orderDate: dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    orderTime: dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    customer: {
      name: user?.name || order.guestName || "—",
      email: user?.email || order.guestEmail || "—",
      phone: user?.phone || order.guestPhone || "—",
      company: user?.company || "—",
      companyId: user?.companyId || "—",
      address: user?.address || "—",
      city: user?.city || "—",
      state: user?.state || "—",
      country: user?.country || "India",
      pincode: user?.pincode || "—",
      gstNumber: user?.gstNumber || "—",
    },
    seller,
    items: order.items.map((i) => ({
      name: i.product.name,
      sku: i.product.sku,
      quantity: i.quantity,
      unitPrice: i.price,
      total: i.total,
    })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    discount: order.discount,
    total: order.total,
    paymentMethod: order.paymentMethod || "—",
    paymentStatus: order.paymentStatus,
    generatedAt: formatDateTime(new Date()),
  };
}
