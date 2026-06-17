"use client";

import { ORDER_STATUSES } from "@/lib/constants";

export function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  async function updateStatus(status: string) {
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    window.location.reload();
  }

  return (
    <select
      value={currentStatus}
      onChange={(e) => updateStatus(e.target.value)}
      className="text-xs border rounded-lg px-2 py-1 bg-white"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
