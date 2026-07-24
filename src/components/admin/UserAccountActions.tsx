"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, CheckCircle, KeyRound, Trash2 } from "lucide-react";

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
  const [loading, setLoading] = useState<"suspend" | "delete" | "password" | null>(null);

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

  async function handleSetPassword() {
    const password = prompt(`Set a new password for ${email} (min 6 characters):`);
    if (password === null) return;
    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    setLoading("password");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Failed to set password");
        return;
      }
      alert("Password updated");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const btn = compact
    ? "inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 shrink-0"
    : "inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50";

  return (
    <div
      className={
        compact
          ? "flex flex-row flex-wrap items-center justify-end gap-1.5"
          : "flex flex-wrap items-center gap-2 mt-4 pt-4 border-t"
      }
    >
      <button
        type="button"
        onClick={handleSetPassword}
        disabled={loading !== null}
        className={`${btn} border border-brand-200 text-brand-800 bg-brand-50 hover:bg-brand-100`}
        title="Set password"
      >
        <KeyRound className="w-3.5 h-3.5 shrink-0" />
        {loading === "password" ? "…" : "Set password"}
      </button>
      {isActive ? (
        <button
          type="button"
          onClick={() => setSuspended(true)}
          disabled={loading !== null}
          className={`${btn} border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100`}
        >
          <Ban className="w-3.5 h-3.5 shrink-0" />
          {loading === "suspend" ? "…" : "Suspend"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setSuspended(false)}
          disabled={loading !== null}
          className={`${btn} border border-green-200 text-green-800 bg-green-50 hover:bg-green-100`}
        >
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          {loading === "suspend" ? "…" : "Reactivate"}
        </button>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading !== null}
        className={`${btn} border border-red-200 text-red-700 bg-red-50 hover:bg-red-100`}
        title="Delete permanently"
      >
        <Trash2 className="w-3.5 h-3.5 shrink-0" />
        {loading === "delete" ? "…" : compact ? "Delete" : "Delete permanently"}
      </button>
    </div>
  );
}
