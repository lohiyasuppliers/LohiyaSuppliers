"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import { OrderStatus } from "@/lib/catalog-shared";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: OrderStatus.PENDING_APPROVAL, label: "Pending Approval" },
  { value: OrderStatus.APPROVED_PAID, label: "Approved (Paid)" },
  { value: OrderStatus.APPROVED_UNPAID, label: "Approved (Unpaid)" },
  { value: OrderStatus.COMPLETED, label: "Completed" },
  { value: OrderStatus.REJECTED, label: "Rejected" },
  { value: OrderStatus.CANCELLED, label: "Cancelled" },
];

interface OrderFiltersProps {
  currentStatus?: string;
  currentFrom?: string;
  currentTo?: string;
}

export function OrderFilters({ currentStatus, currentFrom, currentTo }: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/account/orders?${params.toString()}`);
  }

  function clearAll() {
    router.push("/account/orders");
  }

  const hasFilters = !!(currentStatus || currentFrom || currentTo);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Filter className="w-4 h-4 text-brand-600" />
        Filter Orders
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Status</label>
          <select
            value={currentStatus || ""}
            onChange={(e) => update("status", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">From date</label>
          <input
            type="date"
            value={currentFrom || ""}
            onChange={(e) => update("from", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">To date</label>
          <input
            type="date"
            value={currentTo || ""}
            onChange={(e) => update("to", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
        >
          <X className="w-3 h-3" /> Clear filters
        </button>
      )}
    </div>
  );
}
