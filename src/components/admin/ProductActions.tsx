"use client";

import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductActions({ productId, slug }: { productId: string; slug: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this product?")) return;
    setDeleting(true);
    await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    router.refresh();
    setDeleting(false);
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/products/${slug}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-brand-600">
        <Edit className="w-4 h-4" />
      </Link>
      <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
