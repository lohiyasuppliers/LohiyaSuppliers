"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatDate, formatDateTime } from "@/lib/utils";
import { UserRoleBadge } from "@/components/admin/UserRoleBadge";
import { ArrowLeft, Trash2, Save } from "lucide-react";
import Link from "next/link";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";

interface UserDetailProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    company: string | null;
    companyId: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode: string | null;
    gstNumber: string | null;
    profileComplete: boolean;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    orders: {
      id: string;
      orderNumber: string;
      total: number;
      status: string;
      paymentStatus: string;
      isVerified: boolean;
      invoiceNumber: string | null;
      createdAt: string;
      items: { quantity: number; product: { name: string } }[];
    }[];
    inquiries: { id: string; subject: string; type: string; status: string; createdAt: string }[];
    reviews: { rating: number; comment: string | null; product: { name: string } }[];
    addresses: { label: string; fullName: string; city: string; state: string; pincode: string }[];
  };
}

export function UserDetailPanel({ user }: UserDetailProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email,
    phone: user.phone || "",
    company: user.company || "",
    companyId: user.companyId || "",
    address: user.address || "",
    city: user.city || "",
    state: user.state || "",
    country: user.country || "India",
    pincode: user.pincode || "",
    gstNumber: user.gstNumber || "",
    role: user.role,
    isActive: user.isActive,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) router.refresh();
    else alert("Failed to update user");
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/users");
    else alert((await res.json()).error || "Delete failed");
  }

  const totalSpent = user.orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to User Management
      </Link>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name || user.email}</h1>
          <div className="flex items-center gap-2 mt-1">
            <UserRoleBadge role={user.role} />
            <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {user.isActive ? "Active" : "Inactive"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${user.profileComplete ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
              {user.profileComplete ? "Profile Complete" : "Profile Incomplete"}
            </span>
          </div>
        </div>
        <CsvDownloadButton
          href="/api/admin/users/export"
          label="Export CSV"
          className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold text-gray-900 mb-4">Edit User Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "name", label: "Full Name" },
                { key: "email", label: "Email" },
                { key: "phone", label: "Phone" },
                { key: "company", label: "Company Name" },
                { key: "companyId", label: "Company ID" },
                { key: "gstNumber", label: "GST Number" },
                { key: "address", label: "Address", span: 2 },
                { key: "city", label: "City" },
                { key: "state", label: "State" },
                { key: "country", label: "Country" },
                { key: "pincode", label: "Pincode" },
              ].map((f) => (
                <div key={f.key} className={f.span === 2 ? "sm:col-span-2" : ""}>
                  <label className="text-sm font-medium text-gray-700 block mb-1">{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="CUSTOMER">Customer</option>
                  <option value="B2B_PARTNER">B2B Partner</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Account Active
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
                <Trash2 className="w-4 h-4" /> Delete User
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold text-gray-900 mb-4">Order History ({user.orders.length})</h2>
            {user.orders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders placed</p>
            ) : (
              <div className="space-y-3">
                {user.orders.map((o) => (
                  <div key={o.id} className="block p-3 bg-gray-50 rounded-lg">
                    <Link href={`/admin/orders/${o.id}`} className="hover:text-brand-700">
                      <div className="flex justify-between">
                        <span className="font-medium text-brand-700">{o.orderNumber}</span>
                        <span className="font-bold">{formatPrice(o.total)}</span>
                      </div>
                    </Link>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDateTime(o.createdAt)} · {o.status}
                      {o.isVerified && o.invoiceNumber && (
                        <span className="ml-2 text-green-600 font-medium">Invoice: {o.invoiceNumber}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold text-gray-900 mb-3">Account Info</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-500">User ID</dt><dd className="font-mono text-xs break-all">{user.id}</dd></div>
              <div><dt className="text-gray-500">Joined</dt><dd>{formatDateTime(user.createdAt)}</dd></div>
              <div><dt className="text-gray-500">Last Updated</dt><dd>{formatDateTime(user.updatedAt)}</dd></div>
              <div><dt className="text-gray-500">Total Spent</dt><dd className="font-bold text-brand-700">{formatPrice(totalSpent)}</dd></div>
              <div><dt className="text-gray-500">Verified Invoices</dt><dd>{user.orders.filter((o) => o.isVerified).length}</dd></div>
              <div><dt className="text-gray-500">Reviews</dt><dd>{user.reviews.length}</dd></div>
            </dl>
          </div>

          {user.inquiries.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-bold text-gray-900 mb-3">Inquiries</h2>
              <div className="space-y-2">
                {user.inquiries.map((inq) => (
                  <div key={inq.id} className="text-sm p-2 bg-gray-50 rounded">
                    <div className="font-medium">{inq.subject}</div>
                    <div className="text-xs text-gray-500">{inq.type} · {inq.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
