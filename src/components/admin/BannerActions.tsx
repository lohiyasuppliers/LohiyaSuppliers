"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function BannerActions({ bannerId }: { bannerId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this banner?")) return;
    await fetch(`/api/admin/banners/${bannerId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="p-2 rounded hover:bg-red-50 text-gray-500 hover:text-red-600">
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
