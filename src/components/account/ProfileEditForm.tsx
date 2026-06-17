"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

interface ProfileFormProps {
  initial: {
    name: string;
    email: string;
    company: string;
    phone: string;
    gstin: string;
    billingState: string;
    address: string;
    city: string;
    pincode: string;
  };
}

export function ProfileEditForm({ initial }: ProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg("Profile updated successfully");
      router.refresh();
    } else {
      const data = await res.json();
      setMsg(data.error || "Failed to update profile");
    }
    setSaving(false);
  }

  const fields = [
    { key: "company", label: "Company Name *" },
    { key: "phone", label: "Phone" },
    { key: "gstin", label: "GSTIN" },
    { key: "billingState", label: "Billing State *" },
    { key: "address", label: "Address", full: true },
    { key: "city", label: "City" },
    { key: "pincode", label: "Pincode" },
  ];

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl border p-6">
      <h2 className="font-bold text-gray-900 mb-1">Company & GST Details</h2>
      <p className="text-sm text-gray-500 mb-4">Required for B2B invoicing and tax compliance</p>
      {msg && (
        <p className={`text-sm mb-4 ${msg.includes("success") ? "text-green-600" : "text-red-600"}`}>
          {msg}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-500">Full Name</label>
          <input
            value={form.name}
            disabled
            className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 mt-1"
          />
        </div>
        <div>
          <label className="text-sm text-gray-500">Email</label>
          <input
            value={form.email}
            disabled
            className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 mt-1"
          />
        </div>
        {fields.map((f) => (
          <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
            <label className="text-sm text-gray-500">{f.label}</label>
            <input
              value={form[f.key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm mt-1"
              required={f.label.includes("*")}
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
