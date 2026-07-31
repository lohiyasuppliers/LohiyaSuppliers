"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CrmDashboardData, CrmClientRow } from "@/lib/crm-data";
import { formatPaise } from "@/lib/utils";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";
import { WhatsAppLink } from "@/components/admin/WhatsAppLink";
import {
  Users,
  MapPin,
  Package,
  Tags,
  Search,
  Filter,
  Globe,
  UserX,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  Rajasthan: { lat: 26.9124, lng: 75.7873 },
  Maharashtra: { lat: 19.076, lng: 72.8777 },
  Gujarat: { lat: 23.0225, lng: 72.5714 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462 },
  Haryana: { lat: 28.4595, lng: 77.0266 },
  Punjab: { lat: 30.7333, lng: 76.7794 },
  "Madhya Pradesh": { lat: 23.2599, lng: 77.4126 },
  Karnataka: { lat: 12.9716, lng: 77.5946 },
  "Tamil Nadu": { lat: 13.0827, lng: 80.2707 },
  "West Bengal": { lat: 22.5726, lng: 88.3639 },
  Bihar: { lat: 25.5941, lng: 85.1376 },
  Odisha: { lat: 20.2961, lng: 85.8245 },
  Telangana: { lat: 17.385, lng: 78.4867 },
  "Andhra Pradesh": { lat: 16.5062, lng: 80.648 },
  Kerala: { lat: 9.9312, lng: 76.2673 },
  Assam: { lat: 26.1445, lng: 91.7362 },
  Chhattisgarh: { lat: 21.2514, lng: 81.6296 },
  Jharkhand: { lat: 23.3441, lng: 85.3096 },
  Uttarakhand: { lat: 30.0668, lng: 79.0193 },
};

type FilterType = "all" | "online" | "offline" | "active" | "inactive";

export function CrmDashboard({ data }: { data: CrmDashboardData }) {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.clients.filter((c) => {
      if (typeFilter === "online" && c.clientType !== "online") return false;
      if (typeFilter === "offline" && c.clientType !== "offline") return false;
      if (typeFilter === "active" && !c.isActive) return false;
      if (typeFilter === "inactive" && c.isActive) return false;
      if (stateFilter && c.billingState !== stateFilter) return false;
      if (selectedState && c.billingState !== selectedState) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.gstin || "").toLowerCase().includes(q)
      );
    });
  }, [data.clients, search, stateFilter, typeFilter, selectedState]);

  const states = data.stateBreakdown.map((s) => s.state);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-600" />
            CRM Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Clients, locations, catalog intelligence & exports
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CsvDownloadButton href="/api/admin/crm/export" label="Clients CSV" />
          <CsvDownloadButton
            href="/api/admin/crm/export?type=categories"
            label="Categories CSV"
          />
          <CsvDownloadButton href="/api/admin/crm/export?type=brands" label="Brands CSV" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Clients", value: data.stats.totalClients, icon: Users },
          { label: "Online (ordered)", value: data.stats.onlineClients, icon: Globe },
          { label: "Offline (no orders)", value: data.stats.offlineClients, icon: UserX },
          { label: "Client Revenue", value: formatPaise(data.stats.totalRevenuePaise), icon: IndianRupee },
          { label: "Active Products", value: `${data.stats.activeProducts}/${data.stats.totalProducts}`, icon: Package },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </div>
            <div className="text-lg font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-brand-600" />
            Clients by state
            {selectedState && (
              <button
                type="button"
                onClick={() => setSelectedState(null)}
                className="text-xs text-brand-600 hover:underline ml-2"
              >
                Clear map filter
              </button>
            )}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {data.stateBreakdown.slice(0, 12).map((s) => (
              <button
                key={s.state}
                type="button"
                onClick={() => setSelectedState(s.state === selectedState ? null : s.state)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  selectedState === s.state
                    ? "border-brand-500 bg-brand-50 text-brand-800"
                    : "hover:bg-gray-50"
                )}
              >
                <div className="font-medium truncate">{s.state}</div>
                <div className="text-xs text-gray-500">{s.count} clients</div>
              </button>
            ))}
          </div>
          <CrmMap clients={data.clients} selectedState={selectedState} />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
              <Tags className="w-4 h-4 text-brand-600" />
              Top categories
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto text-sm">
              {data.categoryBreakdown.slice(0, 10).map((c) => (
                <div key={c.slug} className="flex justify-between gap-2">
                  <span className="truncate text-gray-700">{c.name}</span>
                  <span className="shrink-0 text-gray-500">{c.productCount}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-brand-600" />
              Brands in catalog
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto text-sm">
              {data.brandBreakdown.map((b) => (
                <div key={b.brand} className="flex justify-between gap-2">
                  <span className="truncate text-gray-700">{b.brand}</span>
                  <span className="shrink-0 text-gray-500">{b.productCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, company, phone, GSTIN…"
              className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FilterType)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All clients</option>
              <option value="online">Online (has orders)</option>
              <option value="offline">Offline (no orders)</option>
              <option value="active">Active only</option>
              <option value="inactive">Suspended</option>
            </select>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm max-w-[180px]"
            >
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Showing {filtered.length} of {data.clients.length} clients
        </p>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Client</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Company</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Location</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Type</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Orders</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Spent</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <CrmClientRow key={c.id} client={c} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CrmClientRow({ client: c }: { client: CrmClientRow }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2">
        <Link href={`/admin/users/${c.id}`} className="font-medium text-brand-700 hover:underline">
          {c.name || c.email}
        </Link>
        <div className="text-xs text-gray-500">{c.email}</div>
      </td>
      <td className="px-3 py-2">{c.company}</td>
      <td className="px-3 py-2 text-gray-600">
        {[c.city, c.billingState].filter(Boolean).join(", ") || "—"}
      </td>
      <td className="px-3 py-2">
        <span
          className={cn(
            "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
            c.clientType === "online"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-800"
          )}
        >
          {c.clientType}
        </span>
      </td>
      <td className="px-3 py-2">{c.orderCount}</td>
      <td className="px-3 py-2 font-medium">{formatPaise(c.totalSpentPaise)}</td>
      <td className="px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <WhatsAppLink phone={c.phone} name={c.name} compact />
          <Link
            href={`/admin/users/${c.id}`}
            className="text-xs text-brand-600 hover:underline"
          >
            Edit
          </Link>
        </div>
      </td>
    </tr>
  );
}

function CrmMap({
  clients,
  selectedState,
}: {
  clients: CrmClientRow[];
  selectedState: string | null;
}) {
  const markers = useMemo(() => {
    const byState = new Map<string, number>();
    for (const c of clients) {
      if (selectedState && c.billingState !== selectedState) continue;
      const st = c.billingState || "Unknown";
      byState.set(st, (byState.get(st) || 0) + 1);
    }
    return [...byState.entries()].map(([state, count]) => ({
      state,
      count,
      coords: STATE_COORDS[state] || { lat: 22.5937, lng: 78.9629 },
    }));
  }, [clients, selectedState]);

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=68.0,8.0,92.0,32.0&layer=mapnik`;

  return (
    <div className="relative rounded-xl border overflow-hidden bg-slate-100 h-[220px] sm:h-[280px]">
      <iframe
        title="India map"
        src={mapSrc}
        className="w-full h-full border-0 opacity-80"
        loading="lazy"
      />
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
        {markers.slice(0, 8).map((m) => (
          <span
            key={m.state}
            className="inline-flex items-center gap-1 rounded-full bg-white/95 border px-2 py-1 text-xs font-medium shadow-sm"
          >
            <MapPin className="w-3 h-3 text-brand-600" />
            {m.state}: {m.count}
          </span>
        ))}
      </div>
    </div>
  );
}
