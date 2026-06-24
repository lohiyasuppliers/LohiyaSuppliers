import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPaise, formatDate, getStatusColor, getOrderStatusLabel } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { AdminOrderWorkflowPanel } from "@/components/admin/AdminOrderWorkflowPanel";
import { getPaymentStatusLabel } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: {
        include: { clientProfile: true },
      },
      items: { include: { product: true, variation: true } },
    },
  });

  if (!order) notFound();

  const profile = order.client.clientProfile;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-gray-500 text-sm">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
            {getOrderStatusLabel(order.status)}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.paymentStatus)}`}>
            {getPaymentStatusLabel(order.paymentStatus)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold mb-4">Line Items</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Product</th>
                  <th className="text-right px-3 py-2">Qty</th>
                  <th className="text-right px-3 py-2">Unit</th>
                  <th className="text-right px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      {item.productName}
                      {item.variationLabel && (
                        <span className="block text-xs text-gray-500">{item.variationLabel}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{formatPaise(item.unitPricePaise)}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatPaise(item.totalPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Bill total</span>
                <span className="font-medium">{formatPaise(order.totalPaise)}</span>
              </div>
              {order.paidPaise > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Paid (approved)</span>
                  <span className="font-medium">{formatPaise(order.paidPaise)}</span>
                </div>
              )}
              {order.pendingPaymentPaise > 0 && (
                <div className="flex justify-between text-violet-700">
                  <span>Submitted (pending)</span>
                  <span className="font-medium">{formatPaise(order.pendingPaymentPaise)}</span>
                </div>
              )}
              {(order.paidPaise < order.totalPaise || order.pendingPaymentPaise > 0) && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Balance due</span>
                  <span>{formatPaise(order.totalPaise - order.paidPaise - order.pendingPaymentPaise)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AdminOrderWorkflowPanel
            orderId={order.id}
            orderNumber={order.orderNumber}
            status={order.status}
            paymentStatus={order.paymentStatus}
            totalPaise={order.totalPaise}
            paidPaise={order.paidPaise}
            pendingPaymentPaise={order.pendingPaymentPaise}
            paymentProof={order.paymentProof}
            adminComment={order.adminComment}
            rejectionReason={order.rejectionReason}
          />

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold mb-3">Client</h2>
            <p className="font-medium">{profile?.company || order.client.name}</p>
            <p className="text-sm text-gray-500">{order.client.email}</p>
            {profile?.gstin && <p className="text-sm mt-2">GSTIN: {profile.gstin}</p>}
            {profile?.billingState && (
              <p className="text-sm">State: {profile.billingState}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
