"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function CouponActions({ couponId }: { couponId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons/${couponId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600">
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
