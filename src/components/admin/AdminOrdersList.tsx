"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  formatPaise,
  formatDate,
  getStatusColor,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/utils";
import { Search, ArrowRight, Clock, AlertCircle } from "lucide-react";

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalPaise: number;
  paidPaise: number;
  pendingPaymentPaise: number;
  balanceDue: number;
  createdAt: string;
  clientName: string;
  clientEmail: string;
};

export function AdminOrdersList({ orders }: { orders: AdminOrderRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.clientEmail.toLowerCase().includes(q)
    );
  }, [orders, query]);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order #, client, email…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white transition-shadow"
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Order</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Bill</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Paid</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Due</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Submitted</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Payment</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No orders match your search
                  </td>
                </tr>
              ) : (
                filtered.map((order, i) => {
                  const hasPending = order.pendingPaymentPaise > 0;
                  const needsApproval = order.status === "PENDING_APPROVAL";

                  return (
                    <tr
                      key={order.id}
                      className={`group transition-colors hover:bg-brand-50/40 motion-table-row ${
                        hasPending
                          ? "bg-violet-50/50"
                          : needsApproval
                            ? "bg-amber-50/50"
                            : ""
                      }`}
                      style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold text-brand-700 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        {hasPending && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold uppercase text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
                            <Clock className="w-3 h-3" /> Pay verify
                          </span>
                        )}
                        {needsApproval && (
                          <span className="ml-2 inline-flex text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            Approve
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{order.clientName}</div>
                        <div className="text-xs text-gray-500">{order.clientEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatPaise(order.totalPaise)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700 font-medium">
                        {order.paidPaise > 0 ? formatPaise(order.paidPaise) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-700 font-medium">
                        {order.balanceDue > 0 ? formatPaise(order.balanceDue) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {hasPending ? (
                          <span className="font-bold text-violet-700">
                            {formatPaise(order.pendingPaymentPaise)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}
                        >
                          {getPaymentStatusLabel(order.paymentStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Review <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {query && (
          <p className="px-4 py-2 text-xs text-gray-500 border-t bg-gray-50">
            Showing {filtered.length} of {orders.length} orders
          </p>
        )}
      </div>
    </div>
  );
}
