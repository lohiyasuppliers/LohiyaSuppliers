"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Phone, FileText } from "lucide-react";

export function ProfileSetupForm({ userName }: { userName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    company: "",
    phone: "",
    address: "",
    city: "",
    billingState: "",
    pincode: "",
    gstin: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: userName, ...form }),
    });
    if (res.ok) {
      router.push("/account");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save profile");
    }
    setLoading(false);
  }

  const fields = [
    { key: "company", label: "Company Name", icon: Building2 },
    { key: "phone", label: "Phone Number", icon: Phone },
    { key: "address", label: "Street Address", icon: MapPin, full: true },
    { key: "city", label: "City" },
    { key: "billingState", label: "Billing State" },
    { key: "pincode", label: "Pincode" },
    { key: "gstin", label: "GSTIN (optional)", icon: FileText },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Welcome, {userName}!</h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete your business profile to place orders and receive GST invoices.
        </p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {f.label}
              {f.key !== "gstin" ? " *" : ""}
            </label>
            <input
              required={f.key !== "gstin"}
              value={form[f.key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Complete Profile & Continue"}
      </button>
    </form>
  );
}
