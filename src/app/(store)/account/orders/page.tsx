import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPaise, formatDate, getStatusColor, getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/utils";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { OrderFilters } from "@/components/account/OrderFilters";
import { PayOrderButton, PendingPaymentHero } from "@/components/account/PendingPaymentAlert";
import { getPayableOrders, orderBalancePaise, summarizePayable, canPayOrder, getPendingVerificationOrders } from "@/lib/payable-orders";
import { getOrderWorkflowState } from "@/lib/order-workflow";
import { OrderStatus } from "@prisma/client";
import { Suspense } from "react";
import { Package, FileText } from "lucide-react";

export const metadata = { title: "My Orders" };
export const revalidate = 0;

interface Props {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>;
}

export default async function AccountOrdersPage({ searchParams }: Props) {
  const session = await requireAuth();
  const params = await searchParams;

  const where: {
    clientId: string;
    status?: OrderStatus;
    createdAt?: { gte?: Date; lte?: Date };
  } = { clientId: session.user.id };

  if (params.status && Object.values(OrderStatus).includes(params.status as OrderStatus)) {
    where.status = params.status as OrderStatus;
  }

  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = new Date(params.from);
    if (params.to) {
      const to = new Date(params.to);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  const [orders, payableOrders, verificationOrders] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    getPayableOrders(session.user.id),
    getPendingVerificationOrders(session.user.id),
  ]);

  const paymentSummary = {
    ...summarizePayable(payableOrders),
    orders: payableOrders,
    verificationOrders,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <AccountPageHeader
        title="My Orders"
        subtitle="Track order status, payments, and order history"
      />
      <AccountShell>
        {(paymentSummary.totalDuePaise > 0 || verificationOrders.length > 0) && (
          <div className="mb-6" id="outstanding-payments">
            <PendingPaymentHero summary={paymentSummary} />
          </div>
        )}
        <Suspense fallback={<div className="h-24 bg-gray-100 rounded-xl animate-pulse mb-4" />}>
          <OrderFilters
            currentStatus={params.status}
            currentFrom={params.from}
            currentTo={params.to}
          />
        </Suspense>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
            <Package className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-lg font-medium text-gray-700">No orders found</p>
            <Link href="/products" className="text-brand-600 text-sm mt-2 inline-block hover:underline">
              Browse catalog →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {orders.map((order) => {
              const balance = orderBalancePaise(order);
              const canPay = canPayOrder(order);
              const awaitingVerification = order.pendingPaymentPaise > 0;
              const hasRemaining = order.paidPaise > 0 && balance > 0 && !awaitingVerification;
              const workflow = getOrderWorkflowState(order);

              return (
                <div key={order.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                        {order.orderNumber}
                        <Link
                          href={`/account/orders/${order.id}/bill`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Bill
                        </Link>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDate(order.createdAt)} · {order.items.length} items
                      </div>
                      {hasRemaining && (
                        <p className="text-xs text-emerald-700 mt-1 font-medium">
                          {formatPaise(order.paidPaise)} paid · {formatPaise(balance)} remaining
                        </p>
                      )}
                      {awaitingVerification && (
                        <p className="text-xs text-violet-700 mt-1 font-medium">
                          {formatPaise(order.pendingPaymentPaise)} awaiting admin verification
                        </p>
                      )}
                      {order.status === OrderStatus.PENDING_APPROVAL && (
                        <p className="text-xs text-amber-700 mt-1 font-medium">
                          Waiting for admin to approve your order — then you can pay
                        </p>
                      )}
                      {order.adminComment && (
                        <p className="text-xs text-slate-600 mt-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="font-semibold text-slate-800">Admin: </span>
                          {order.adminComment}
                        </p>
                      )}
                      {!canPay && !awaitingVerification && order.status !== OrderStatus.PENDING_APPROVAL && workflow.clientMessage && balance > 0 && (
                        <p className="text-xs text-gray-600 mt-1">{workflow.clientMessage}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand-900">{formatPaise(order.totalPaise)}</div>
                      <div className="flex flex-wrap gap-2 mt-2 justify-end items-center">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.paymentStatus)}`}
                        >
                          {getPaymentStatusLabel(order.paymentStatus)}
                        </span>
                      </div>
                      {canPay && (
                        <div className="mt-3">
                          <PayOrderButton
                            orderId={order.id}
                            orderNumber={order.orderNumber}
                            balancePaise={balance}
                            totalPaise={order.totalPaise}
                            paidPaise={order.paidPaise}
                            allOrders={payableOrders}
                            totalDuePaise={paymentSummary.totalDuePaise}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AccountShell>
    </div>
  );
}
