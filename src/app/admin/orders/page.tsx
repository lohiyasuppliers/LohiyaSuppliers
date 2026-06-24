import { prisma } from "@/lib/prisma";
import { formatPaise, getOrderStatusLabel, getStatusColor } from "@/lib/utils";
import { orderBalancePaise } from "@/lib/payable-orders";
import Link from "next/link";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";
import { AdminOrdersList, type AdminOrderRow } from "@/components/admin/AdminOrdersList";
import { ClipboardList, IndianRupee, Clock, AlertTriangle } from "lucide-react";

export const metadata = { title: "Orders" };
export const revalidate = 15;

interface Props {
  searchParams: Promise<{ filter?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const pendingPaymentOnly = filter === "pending_payment";
  const pendingApprovalOnly = filter === "pending_approval";

  const [orders, pendingPaymentCount, pendingApprovalCount, totalCollected] = await Promise.all([
    prisma.order.findMany({
      where: pendingPaymentOnly
        ? { pendingPaymentPaise: { gt: 0 }, paymentStatus: "PENDING_VERIFICATION" }
        : pendingApprovalOnly
          ? { status: "PENDING_APPROVAL" }
          : undefined,
      include: {
        client: {
          select: {
            name: true,
            email: true,
            clientProfile: { select: { company: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.order.count({
      where: { pendingPaymentPaise: { gt: 0 }, paymentStatus: "PENDING_VERIFICATION" },
    }),
    prisma.order.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.order.aggregate({
      _sum: { paidPaise: true },
    }),
  ]);

  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const rows: AdminOrderRow[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalPaise: order.totalPaise,
    paidPaise: order.paidPaise,
    pendingPaymentPaise: order.pendingPaymentPaise,
    balanceDue: orderBalancePaise(order),
    createdAt: order.createdAt.toISOString(),
    clientName: order.client?.clientProfile?.company || order.client?.name || "—",
    clientEmail: order.client?.email || "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-brand-600" />
            Order Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {orders.length} orders shown · {formatPaise(totalCollected._sum.paidPaise ?? 0)} total
            collected
          </p>
        </div>
        <CsvDownloadButton href="/api/admin/orders/export" label="Download Orders (CSV)" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger-children">
        <div className="rounded-xl border bg-white p-4 shadow-sm card-hover">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
            <IndianRupee className="w-4 h-4" /> Collected
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {formatPaise(totalCollected._sum.paidPaise ?? 0)}
          </p>
        </div>
        <Link
          href="/admin/orders?filter=pending_approval"
          className="rounded-xl border bg-amber-50 border-amber-100 p-4 shadow-sm card-hover block"
        >
          <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold uppercase">
            <AlertTriangle className="w-4 h-4" /> Awaiting approval
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-1">{pendingApprovalCount}</p>
        </Link>
        <Link
          href="/admin/orders?filter=pending_payment"
          className="rounded-xl border bg-violet-50 border-violet-100 p-4 shadow-sm card-hover block"
        >
          <div className="flex items-center gap-2 text-violet-700 text-xs font-semibold uppercase">
            <Clock className="w-4 h-4" /> Pending payments
          </div>
          <p className="text-2xl font-bold text-violet-900 mt-1">{pendingPaymentCount}</p>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            !pendingPaymentOnly && !pendingApprovalOnly
              ? "bg-brand-600 text-white border-brand-600 shadow-md"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          All orders
        </Link>
        <Link
          href="/admin/orders?filter=pending_approval"
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            pendingApprovalOnly
              ? "bg-amber-600 text-white border-amber-600 shadow-md"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Awaiting approval{pendingApprovalCount > 0 ? ` (${pendingApprovalCount})` : ""}
        </Link>
        <Link
          href="/admin/orders?filter=pending_payment"
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            pendingPaymentOnly
              ? "bg-violet-600 text-white border-violet-600 shadow-md"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Pending payments{pendingPaymentCount > 0 ? ` (${pendingPaymentCount})` : ""}
        </Link>
      </div>

      {!pendingPaymentOnly && !pendingApprovalOnly && (
        <div className="flex flex-wrap gap-3 animate-fade-in">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className={`px-4 py-2 rounded-lg text-sm ${getStatusColor(status)}`}>
              {getOrderStatusLabel(status)}: <strong>{count}</strong>
            </div>
          ))}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500 animate-fade-in">
          {pendingApprovalOnly
            ? "No orders awaiting approval"
            : pendingPaymentOnly
              ? "No payments awaiting verification"
              : "No orders yet"}
        </div>
      ) : (
        <AdminOrdersList orders={rows} />
      )}
    </div>
  );
}
