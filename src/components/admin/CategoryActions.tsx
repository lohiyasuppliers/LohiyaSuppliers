"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function CategoryActions({
  categoryId,
  productCount,
  childCount = 0,
  label = "category",
}: {
  categoryId: string;
  productCount: number;
  childCount?: number;
  label?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const parts: string[] = [];
    if (childCount > 0) parts.push(`${childCount} subcategor${childCount === 1 ? "y" : "ies"}`);
    if (productCount > 0) parts.push(`${productCount} product${productCount === 1 ? "" : "s"}`);

    const detail =
      parts.length > 0
        ? `\n\nThis will also remove ${parts.join(" and ")}. Products with order history will be moved to Archived (hidden).`
        : "";

    if (!confirm(`Delete this ${label}?${detail}\n\nThis cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Delete failed");
        return;
      }
      router.refresh();
    } catch {
      alert("Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      title={deleting ? "Deleting…" : "Delete"}
      className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
