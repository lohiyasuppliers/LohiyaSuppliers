"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SETTING_FIELDS = [
  { key: "business_name", label: "Business Name", type: "text" },
  { key: "business_gstin", label: "Business GSTIN", type: "text" },
  { key: "business_state", label: "Business State (for GST)", type: "text" },
  { key: "contact_email", label: "Contact Email", type: "email" },
  { key: "contact_phone", label: "Contact Phone", type: "text" },
  {
    key: "allow_voucher_cashback_stack",
    label: "Allow Voucher + Cashback Stacking",
    type: "select",
    options: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ],
  },
];

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 max-w-2xl space-y-4">
      {SETTING_FIELDS.map((field) => (
        <div key={field.key}>
          <label className="text-sm font-medium text-gray-700 block mb-1">{field.label}</label>
          {field.type === "select" ? (
            <select
              value={form[field.key] || "true"}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {field.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              value={form[field.key] || ""}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : saved ? "Saved!" : "Save Settings"}
      </button>
    </form>
  );
}
