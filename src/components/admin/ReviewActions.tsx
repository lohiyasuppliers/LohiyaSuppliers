"use client";

import { useRouter } from "next/navigation";
import { Check, X, Trash2 } from "lucide-react";
import { useState } from "react";

export function ReviewActions({
  reviewId,
  isApproved,
}: {
  reviewId: string;
  isApproved: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(approved: boolean) {
    setLoading(true);
    await fetch(`/api/admin/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: approved }),
    });
    router.refresh();
    setLoading(false);
  }

  async function remove() {
    if (!confirm("Delete this review permanently?")) return;
    setLoading(true);
    await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {!isApproved && (
        <button
          type="button"
          disabled={loading}
          onClick={() => update(true)}
          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
          title="Approve"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
      {isApproved && (
        <button
          type="button"
          disabled={loading}
          onClick={() => update(false)}
          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
          title="Unapprove"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={remove}
        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
