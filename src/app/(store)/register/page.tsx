"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    company: "",
    gstin: "",
    billingState: "Maharashtra",
    address: "",
    city: "",
    pincode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        router.push("/login?registered=1");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Register as B2B Client</h1>
          <p className="text-gray-500 mt-1">
            Active immediately — default prices until admin sets your custom rates
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-8 shadow-sm space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Company Name *</label>
            <Input required value={form.company} onChange={(e) => update("company", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Contact Name *</label>
            <Input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
            <Input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password *</label>
            <Input type="password" required value={form.password} onChange={(e) => update("password", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">GSTIN</label>
            <Input value={form.gstin} onChange={(e) => update("gstin", e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Billing State *</label>
            <select
              required
              value={form.billingState}
              onChange={(e) => update("billingState", e.target.value)}
              className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating Account..." : "Create Client Account"}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already registered?{" "}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
