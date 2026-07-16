"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  userId: string;
  allowGstChoice: boolean;
}

export function ClientGstChoiceToggle({ userId, allowGstChoice }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(allowGstChoice);
  const [saving, setSaving] = useState(false);

  async function handleToggle(next: boolean) {
    setEnabled(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowGstChoice: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEnabled(!next);
        alert(data.error || "Failed to update GST option");
        return;
      }
      router.refresh();
    } catch {
      setEnabled(!next);
      alert("Failed to update GST option");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">GST payment choice</h3>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            When enabled, this client can choose at checkout to pay with 18% GST or without GST.
            Other clients always pay with GST.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            disabled={saving}
            onChange={(e) => handleToggle(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-gray-800">
            {saving ? "Saving…" : enabled ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>
    </div>
  );
}
