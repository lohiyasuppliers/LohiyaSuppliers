import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPaise, formatDate, getStatusColor } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { OrderStatusUpdater } from "@/components/admin/OrderStatusUpdater";

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
      invoice: true,
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
            {order.status.replace(/_/g, " ")}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.paymentStatus)}`}>
            {order.paymentStatus}
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
            <div className="mt-4 pt-4 border-t space-y-1 text-sm text-right">
              <div>Subtotal: {formatPaise(order.subtotalPaise)}</div>
              {order.discountPaise > 0 && (
                <div className="text-green-600">Discount: -{formatPaise(order.discountPaise)}</div>
              )}
              <div className="font-bold text-lg">{formatPaise(order.totalPaise)}</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold mb-3">Update Status</h2>
            <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
            <p className="text-xs text-gray-500 mt-2">Type: {order.orderType}</p>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold mb-3">Client</h2>
            <p className="font-medium">{profile?.company || order.client.name}</p>
            <p className="text-sm text-gray-500">{order.client.email}</p>
            {profile?.gstin && <p className="text-sm mt-2">GSTIN: {profile.gstin}</p>}
            {profile?.billingState && (
              <p className="text-sm">State: {profile.billingState}</p>
            )}
          </div>

          {order.invoice && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-bold mb-2">Invoice</h2>
              <p className="text-sm">{order.invoice.invoiceNumber}</p>
              <p className="text-sm font-medium mt-1">{formatPaise(order.invoice.totalPaise)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
