"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, CheckCircle, Trash2 } from "lucide-react";

interface Props {
  userId: string;
  email: string;
  isActive: boolean;
  role: string;
  canManage?: boolean;
  redirectOnDelete?: boolean;
  compact?: boolean;
}

export function UserAccountActions({
  userId,
  email,
  isActive,
  role,
  canManage = true,
  redirectOnDelete = false,
  compact = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"suspend" | "delete" | null>(null);

  if (!canManage || role === "ADMIN") {
    return (
      <span className="text-xs text-gray-400">{role === "ADMIN" ? "Admin account" : "—"}</span>
    );
  }

  async function setSuspended(suspended: boolean) {
    const action = suspended ? "suspend" : "reactivate";
    const message = suspended
      ? `Suspend ${email}? They will not be able to sign in or place orders.`
      : `Reactivate ${email}? They will be able to sign in again.`;
    if (!confirm(message)) return;

    setLoading("suspend");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !suspended }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || `Failed to ${action} user`);
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    const confirmed = confirm(
      `Permanently delete ${email}?\n\nThis removes their profile, orders, pricing, cashback, and bills. This cannot be undone.`
    );
    if (!confirmed) return;
    const typed = prompt(`Type DELETE to confirm permanent deletion of ${email}`);
    if (typed !== "DELETE") return;

    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Delete failed");
        return;
      }
      if (redirectOnDelete) router.push("/admin/users");
      else router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const btn = compact
    ? "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium disabled:opacity-50"
    : "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-4 pt-4 border-t"}`}>
      {isActive ? (
        <button
          type="button"
          onClick={() => setSuspended(true)}
          disabled={loading !== null}
          className={`${btn} border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100`}
        >
          <Ban className="w-3.5 h-3.5" />
          {loading === "suspend" ? "Suspending…" : "Suspend"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setSuspended(false)}
          disabled={loading !== null}
          className={`${btn} border border-green-200 text-green-800 bg-green-50 hover:bg-green-100`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {loading === "suspend" ? "Saving…" : "Reactivate"}
        </button>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading !== null}
        className={`${btn} border border-red-200 text-red-700 bg-red-50 hover:bg-red-100`}
      >
        <Trash2 className="w-3.5 h-3.5" />
        {loading === "delete" ? "Deleting…" : "Delete permanently"}
      </button>
    </div>
  );
}
