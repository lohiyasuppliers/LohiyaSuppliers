"use client";

import { useRouter } from "next/navigation";

export function SubscriberActions({ subscriberId, email }: { subscriberId: string; email: string }) {
  const router = useRouter();

  async function unsubscribe() {
    if (!confirm(`Unsubscribe ${email}?`)) return;
    await fetch(`/api/admin/subscribers/${subscriberId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={unsubscribe} className="text-xs text-red-600 hover:underline">
      Unsubscribe
    </button>
  );
}
