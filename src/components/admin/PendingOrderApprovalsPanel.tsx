import Link from "next/link";
import { formatPaise, formatDate } from "@/lib/utils";
import { ClipboardCheck, ArrowRight, Clock } from "lucide-react";

type PendingOrder = {
  id: string;
  orderNumber: string;
  totalPaise: number;
  createdAt: Date;
  client: {
    name: string | null;
    email: string;
    clientProfile: { company: string | null } | null;
  };
};

export function PendingOrderApprovalsPanel({ orders }: { orders: PendingOrder[] }) {
  if (orders.length === 0) return null;

  return (
    <div className="admin-slide-up rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
      <div className="p-5 md:p-6 border-b border-amber-100 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mb-1">
            <ClipboardCheck className="w-4 h-4" />
            Pay Later — Approve Orders
          </div>
          <h2 className="text-xl font-bold text-amber-950">
            {orders.length} order{orders.length > 1 ? "s" : ""} waiting for approval
          </h2>
          <p className="text-sm text-amber-800 mt-1">
            Approve each order so clients can pay from their dashboard.
          </p>
        </div>
        <Link
          href="/admin/orders?filter=pending_approval"
          className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800 hover:text-amber-950"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-amber-100">
        {orders.slice(0, 6).map((order) => {
          const clientName =
            order.client.clientProfile?.company || order.client.name || order.client.email;

          return (
            <div
              key={order.id}
              className="flex flex-wrap items-center gap-4 px-5 md:px-6 py-4 hover:bg-amber-100/40 transition-colors"
            >
              <div className="flex-1 min-w-[200px]">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-bold text-amber-900 hover:underline"
                >
                  {order.orderNumber}
                </Link>
                <p className="text-sm text-gray-600 mt-0.5">{clientName}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(order.createdAt)}
                </p>
              </div>

              <div className="rounded-lg bg-white border border-amber-200 px-4 py-2 text-center">
                <p className="text-xs text-gray-500">Bill total</p>
                <p className="font-bold text-gray-900">{formatPaise(order.totalPaise)}</p>
              </div>

              <Link
                href={`/admin/orders/${order.id}`}
                className="shrink-0 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700"
              >
                Approve order
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
