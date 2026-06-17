"use client";

import { useRouter } from "next/navigation";

export function CustomerToggle({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();

  async function toggle() {
    await fetch(`/api/admin/customers/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  return (
    <button onClick={toggle}
      className={`px-3 py-1 rounded-full text-xs font-medium ${isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
