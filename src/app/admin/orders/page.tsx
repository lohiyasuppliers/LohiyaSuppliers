import { prisma } from "@/lib/prisma";
import { formatPaise, formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { OrderStatusUpdater } from "@/components/admin/OrderStatusUpdater";

export const metadata = { title: "Orders" };
export const revalidate = 15;

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      client: {
        select: {
          name: true,
          email: true,
          clientProfile: { select: { company: true } },
        },
      },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-500 text-sm">
          {orders.length} orders · approve prepaid/postpaid B2B orders
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className={`px-4 py-2 rounded-lg text-sm ${getStatusColor(status)}`}>
            {status.replace(/_/g, " ")}: <strong>{count}</strong>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Items</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Payment</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  No orders yet
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-brand-700">
                    <Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{order.client?.clientProfile?.company || order.client?.name}</div>
                    <div className="text-xs text-gray-500">{order.client?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.orderType}</td>
                  <td className="px-4 py-3 text-gray-600">{order.items.length}</td>
                  <td className="px-4 py-3 font-medium">{formatPaise(order.totalPaise)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.paymentStatus)}`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
