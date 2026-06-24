"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPaise } from "@/lib/utils";
import { Gift, Tag, Search, ChevronRight } from "lucide-react";
import { AdminRedemptionQueue } from "@/components/admin/AdminRedemptionQueue";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";

interface ClientRow {
  id: string;
  name: string | null;
  email: string;
  company: string;
  discountRuleCount: number;
  availableCashbackPaise: number;
  lockedCashbackPaise: number;
}

export default function AdminRewardsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/rewards")
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount & Cashback</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage per-client order discounts and cashback wallets. Expires after 30 days by default.
          </p>
        </div>
        <CsvDownloadButton href="/api/admin/rewards/export" label="Download CSV" />
      </div>

      <AdminRedemptionQueue />

      <div className="bg-white rounded-xl border p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client…"
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-48 bg-white rounded-xl border animate-pulse" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Discounts</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Locked</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.name || c.email}</p>
                    <p className="text-xs text-gray-500">{c.company}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <Tag className="w-3.5 h-3.5" />
                      {c.discountRuleCount} rule{c.discountRuleCount === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-amber-800">
                    {formatPaise(c.availableCashbackPaise)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatPaise(c.lockedCashbackPaise)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/rewards/${c.id}`}
                      className="inline-flex items-center gap-1 text-brand-600 font-medium hover:underline"
                    >
                      Manage <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="p-8 text-center text-gray-500">No clients found.</p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border bg-emerald-50/50 p-4">
          <h3 className="font-bold text-emerald-900 flex items-center gap-2">
            <Tag className="w-4 h-4" /> Discount flow
          </h3>
          <p className="text-gray-600 mt-2">
            Cart ₹1,000 + ₹100 discount → client pays <strong>₹900</strong> at checkout (pay now or
            later on the reduced total).
          </p>
        </div>
        <div className="rounded-xl border bg-amber-50/50 p-4">
          <h3 className="font-bold text-amber-900 flex items-center gap-2">
            <Gift className="w-4 h-4" /> Cashback flow
          </h3>
          <p className="text-gray-600 mt-2">
            Earn ₹100 cashback → <strong>locked</strong> until order fully paid. Pay at checkout =
            available immediately. Use on next order, UPI, or gift card. Expires in 30 days.
          </p>
        </div>
      </div>
    </div>
  );
}
