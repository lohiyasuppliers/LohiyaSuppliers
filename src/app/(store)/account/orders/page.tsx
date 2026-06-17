import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPaise, formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { AccountSidebar } from "@/components/account/AccountSidebar";

export const metadata = { title: "My Orders" };

export default async function AccountOrdersPage() {
  const session = await requireAuth();

  const orders = await prisma.order.findMany({
    where: { clientId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <AccountSidebar />
        <div className="lg:col-span-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
              <p className="text-lg">No orders yet</p>
              <Link href="/products" className="text-brand-600 text-sm mt-2 inline-block">
                Browse catalog →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border divide-y">
              {orders.map((order) => (
                <div key={order.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDate(order.createdAt)} · {order.orderType} · {order.items.length}{" "}
                        items
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand-900">{formatPaise(order.totalPaise)}</div>
                      <div className="flex gap-2 mt-2 justify-end">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.paymentStatus)}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
