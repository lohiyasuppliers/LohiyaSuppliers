import Link from "next/link";
import { formatPaise, formatDate } from "@/lib/utils";
import { IndianRupee, ArrowRight, Clock } from "lucide-react";

type PendingOrder = {
  id: string;
  orderNumber: string;
  totalPaise: number;
  paidPaise: number;
  pendingPaymentPaise: number;
  updatedAt: Date;
  client: {
    name: string | null;
    email: string;
    clientProfile: { company: string | null } | null;
  };
};

export function PendingPaymentsPanel({ orders }: { orders: PendingOrder[] }) {
  if (orders.length === 0) return null;

  const totalSubmitted = orders.reduce((s, o) => s + o.pendingPaymentPaise, 0);

  return (
    <div className="admin-slide-up rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 overflow-hidden">
      <div className="p-5 md:p-6 border-b border-violet-100 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-700 text-sm font-semibold mb-1">
            <IndianRupee className="w-4 h-4" />
            Partial Payments — Action Required
          </div>
          <h2 className="text-xl font-bold text-violet-950">
            {orders.length} payment{orders.length > 1 ? "s" : ""} awaiting verification
          </h2>
          <p className="text-sm text-violet-700 mt-1">
            Total submitted: <strong>{formatPaise(totalSubmitted)}</strong> — approve each amount
            individually, not the full bill.
          </p>
        </div>
        <Link
          href="/admin/orders?filter=pending_payment"
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-violet-100">
        {orders.slice(0, 6).map((order) => {
          const remaining = order.totalPaise - order.paidPaise - order.pendingPaymentPaise;
          const clientName =
            order.client.clientProfile?.company || order.client.name || order.client.email;

          return (
            <div
              key={order.id}
              className="flex flex-wrap items-center gap-4 px-5 md:px-6 py-4 hover:bg-violet-100/40 transition-colors"
            >
              <div className="flex-1 min-w-[200px]">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-bold text-violet-900 hover:underline"
                >
                  {order.orderNumber}
                </Link>
                <p className="text-sm text-gray-600 mt-0.5">{clientName}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(order.updatedAt)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs min-w-[280px]">
                <div className="rounded-lg bg-white border border-violet-100 px-2 py-2">
                  <p className="text-gray-500">Bill</p>
                  <p className="font-bold text-gray-900">{formatPaise(order.totalPaise)}</p>
                </div>
                <div className="rounded-lg bg-violet-100 border border-violet-200 px-2 py-2">
                  <p className="text-violet-700 font-semibold">Submitted</p>
                  <p className="font-black text-violet-900">{formatPaise(order.pendingPaymentPaise)}</p>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-2">
                  <p className="text-amber-700">Due after</p>
                  <p className="font-bold text-amber-900">{formatPaise(Math.max(0, remaining))}</p>
                </div>
              </div>

              <Link
                href={`/admin/orders/${order.id}`}
                className="shrink-0 px-4 py-2 bg-violet-700 text-white text-sm font-semibold rounded-lg hover:bg-violet-800"
              >
                Review
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
