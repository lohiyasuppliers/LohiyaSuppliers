"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CrmDashboardData, CrmClientRow } from "@/lib/crm-data";
import { formatPaise } from "@/lib/utils";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";
import { WhatsAppLink } from "@/components/admin/WhatsAppLink";
import { CrmInteractiveMap } from "@/components/admin/CrmInteractiveMap";
import {
  Users,
  MapPin,
  Package,
  Tags,
  Search,
  Globe,
  UserX,
  IndianRupee,
  LayoutDashboard,
  Layers,
  ExternalLink,
  ShoppingCart,
  MessageCircle,
  Box,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "overview" | "clients" | "locations" | "products" | "categories";
type FilterType = "all" | "online" | "offline" | "active" | "inactive";

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "clients", label: "Clients", icon: Users },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Tags },
];

export function CrmDashboard({ data }: { data: CrmDashboardData }) {
  const [tab, setTab] = useState<TabId>("overview");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  const filteredClients = useMemo(() => filterClients(data.clients, search, typeFilter, stateFilter, selectedState), [
    data.clients, search, typeFilter, stateFilter, selectedState,
  ]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return data.products;
    return data.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [data.products, productSearch]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return data.categories;
    return data.categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
    );
  }, [data.categories, categorySearch]);

  const states = data.stateBreakdown.map((s) => s.state);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-950 via-brand-800 to-brand-700 text-white p-5 sm:p-6 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">CRM Command Center</h1>
            <p className="text-brand-100 text-sm mt-1 max-w-xl">
              All clients, locations, catalog & revenue — live from your database
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CsvDownloadButton href="/api/admin/crm/export" label="Clients" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20" />
            <CsvDownloadButton href="/api/admin/crm/export?type=locations" label="Locations" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20" />
            <CsvDownloadButton href="/api/admin/crm/export?type=products" label="Products" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20" />
            <CsvDownloadButton href="/api/admin/crm/export?type=categories" label="Categories" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
          {[
            { label: "Clients", value: data.stats.totalClients, sub: `${data.stats.clientsWithLocation} with address` },
            { label: "Revenue", value: formatPaise(data.stats.totalRevenuePaise), sub: `${data.stats.totalOrders} orders` },
            { label: "Online", value: data.stats.onlineClients, sub: "placed orders" },
            { label: "Offline", value: data.stats.offlineClients, sub: "no orders yet" },
            { label: "Products", value: data.stats.activeProducts, sub: `${data.stats.totalVariations} variants` },
            { label: "Categories", value: data.stats.totalCategories, sub: `${data.stats.totalDepartments} departments` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur border border-white/10 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-brand-200">{s.label}</div>
              <div className="text-lg font-bold mt-0.5">{s.value}</div>
              <div className="text-[10px] text-brand-200/80">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors",
              tab === t.id
                ? "bg-white text-brand-700 border border-b-0 border-gray-200 shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.id === "locations" && (
              <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
                {data.locations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab data={data} selectedState={selectedState} onSelectState={setSelectedState} />
      )}
      {tab === "clients" && (
        <ClientsTab
          clients={filteredClients}
          total={data.clients.length}
          search={search}
          onSearch={setSearch}
          typeFilter={typeFilter}
          onTypeFilter={setTypeFilter}
          stateFilter={stateFilter}
          onStateFilter={setStateFilter}
          states={states}
        />
      )}
      {tab === "locations" && (
        <LocationsTab
          locations={data.locations}
          clients={data.clients}
          cityBreakdown={data.cityBreakdown}
          stateBreakdown={data.stateBreakdown}
          selectedState={selectedState}
          onSelectState={setSelectedState}
        />
      )}
      {tab === "products" && (
        <ProductsTab
          products={filteredProducts}
          total={data.products.length}
          brands={data.brandBreakdown}
          search={productSearch}
          onSearch={setProductSearch}
        />
      )}
      {tab === "categories" && (
        <CategoriesTab
          departments={data.departments}
          categories={filteredCategories}
          totalCategories={data.categories.length}
          search={categorySearch}
          onSearch={setCategorySearch}
        />
      )}
    </div>
  );
}

function filterClients(
  clients: CrmClientRow[],
  search: string,
  typeFilter: FilterType,
  stateFilter: string,
  selectedState: string | null
) {
  const q = search.trim().toLowerCase();
  return clients.filter((c) => {
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
      (c.address || "").toLowerCase().includes(q) ||
      (c.gstin || "").toLowerCase().includes(q) ||
      c.fullAddress.toLowerCase().includes(q)
    );
  });
}

function OverviewTab({
  data,
  selectedState,
  onSelectState,
}: {
  data: CrmDashboardData;
  selectedState: string | null;
  onSelectState: (s: string | null) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-600" />
              Client locations map
              <span className="text-xs font-normal text-gray-500">({data.locations.length} pins)</span>
            </h2>
            {selectedState && (
              <button type="button" onClick={() => onSelectState(null)} className="text-xs text-brand-600 hover:underline">
                Show all states
              </button>
            )}
          </div>
          <CrmInteractiveMap locations={data.locations} highlightState={selectedState} />
        </div>
        <div className="space-y-4">
          <Card title="By state" icon={Globe}>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {data.stateBreakdown.map((s) => (
                <button
                  key={s.state}
                  type="button"
                  onClick={() => onSelectState(s.state === selectedState ? null : s.state)}
                  className={cn(
                    "w-full flex justify-between items-center rounded-lg px-3 py-2 text-sm transition-colors",
                    selectedState === s.state ? "bg-brand-50 text-brand-800" : "hover:bg-gray-50"
                  )}
                >
                  <span className="font-medium truncate">{s.state}</span>
                  <span className="text-gray-500 shrink-0 ml-2">{s.count} · {formatPaise(s.revenuePaise)}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card title="Top brands" icon={Box}>
            <div className="space-y-1.5 max-h-40 overflow-y-auto text-sm">
              {data.brandBreakdown.slice(0, 8).map((b) => (
                <div key={b.brand} className="flex justify-between gap-2">
                  <span className="truncate text-gray-700">{b.brand}</span>
                  <span className="text-gray-400">{b.productCount}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="Recent clients" icon={Users}>
          <div className="space-y-2">
            {data.recentClients.map((c) => (
              <Link key={c.id} href={`/admin/users/${c.id}`} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 text-sm">
                <span className="font-medium text-brand-700">{c.company}</span>
                <span className="text-gray-400 text-xs">{new Date(c.joinedAt).toLocaleDateString("en-IN")}</span>
              </Link>
            ))}
          </div>
        </Card>
        <Card title="Catalog snapshot" icon={Layers}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <StatBox label="Departments" value={data.stats.totalDepartments} />
            <StatBox label="Subcategories" value={data.stats.totalCategories} />
            <StatBox label="Active products" value={data.stats.activeProducts} />
            <StatBox label="Brands" value={data.stats.totalBrands} />
            <StatBox label="Variations" value={data.stats.totalVariations} />
            <StatBox label="Support threads" value={data.stats.openSupportThreads} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function LocationsTab({
  locations,
  clients,
  cityBreakdown,
  stateBreakdown,
  selectedState,
  onSelectState,
}: {
  locations: CrmDashboardData["locations"];
  clients: CrmClientRow[];
  cityBreakdown: CrmDashboardData["cityBreakdown"];
  stateBreakdown: CrmDashboardData["stateBreakdown"];
  selectedState: string | null;
  onSelectState: (s: string | null) => void;
}) {
  const [locSearch, setLocSearch] = useState("");
  const filtered = useMemo(() => {
    const q = locSearch.trim().toLowerCase();
    let list = selectedState ? locations.filter((l) => l.state === selectedState) : locations;
    if (!q) return list;
    return list.filter(
      (l) =>
        l.company.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.fullAddress.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q)
    );
  }, [locations, locSearch, selectedState]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-600" />
            All client locations
          </h2>
          <p className="text-xs text-gray-500">
            {clients.filter((c) => c.hasLocation).length} with full address · {locations.length} on map
          </p>
        </div>
        <CrmInteractiveMap locations={locations} highlightState={selectedState} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={locSearch}
              onChange={(e) => setLocSearch(e.target.value)}
              placeholder="Search company, city, state, address…"
              className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm"
            />
          </div>
          <p className="text-xs text-gray-500">{filtered.length} locations</p>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filtered.map((loc) => (
              <div key={loc.id} className="rounded-xl border border-gray-100 p-3 hover:border-brand-200 hover:bg-brand-50/30 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/admin/users/${loc.id}`} className="font-semibold text-brand-700 hover:underline">
                      {loc.company}
                    </Link>
                    <p className="text-sm text-gray-600">{loc.name}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{loc.fullAddress}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                      <span>{loc.city}, {loc.state}</span>
                      {loc.pincode && <span>· {loc.pincode}</span>}
                      <span>· {loc.orderCount} orders</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full",
                        loc.clientType === "online" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                      )}>
                        {loc.clientType}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {loc.mapUrl && (
                      <a
                        href={loc.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open in Maps
                      </a>
                    )}
                    <WhatsAppLink phone={loc.phone} name={loc.name} compact />
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-gray-500 py-8 text-center">No locations match your search</p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <Card title="By city" icon={MapPin}>
            <div className="space-y-1 max-h-64 overflow-y-auto text-sm">
              {cityBreakdown.slice(0, 20).map((c) => (
                <div key={`${c.city}-${c.state}`} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="truncate text-gray-700">{c.city}, {c.state}</span>
                  <span className="text-gray-400 shrink-0 ml-2">{c.count}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="By state" icon={Globe}>
            <div className="space-y-1 max-h-48 overflow-y-auto text-sm">
              {stateBreakdown.map((s) => (
                <button
                  key={s.state}
                  type="button"
                  onClick={() => onSelectState(s.state === selectedState ? null : s.state)}
                  className={cn(
                    "w-full flex justify-between py-1.5 rounded-lg px-2",
                    selectedState === s.state ? "bg-brand-50" : "hover:bg-gray-50"
                  )}
                >
                  <span>{s.state}</span>
                  <span className="text-gray-400">{s.count}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ClientsTab({
  clients,
  total,
  search,
  onSearch,
  typeFilter,
  onTypeFilter,
  stateFilter,
  onStateFilter,
  states,
}: {
  clients: CrmClientRow[];
  total: number;
  search: string;
  onSearch: (v: string) => void;
  typeFilter: FilterType;
  onTypeFilter: (v: FilterType) => void;
  stateFilter: string;
  onStateFilter: (v: string) => void;
  states: string[];
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-4">
      <FilterBar
        search={search}
        onSearch={onSearch}
        searchPlaceholder="Search clients…"
        typeFilter={typeFilter}
        onTypeFilter={onTypeFilter}
        stateFilter={stateFilter}
        onStateFilter={onStateFilter}
        states={states}
        count={clients.length}
        total={total}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-gray-50 rounded-lg">
            <tr>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">Client</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">Company</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">Full location</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">Type</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">Orders</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">Spent</th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/80">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/users/${c.id}`} className="font-medium text-brand-700 hover:underline">
                    {c.name || c.email}
                  </Link>
                  <div className="text-xs text-gray-500">{c.email}</div>
                </td>
                <td className="px-3 py-2.5">{c.company}</td>
                <td className="px-3 py-2.5 text-gray-600 max-w-[220px]">
                  <p className="truncate" title={c.fullAddress}>{c.fullAddress || "—"}</p>
                  {c.mapUrl && (
                    <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline inline-flex items-center gap-0.5 mt-0.5">
                      <MapPin className="w-3 h-3" /> Maps
                    </a>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <TypeBadge type={c.clientType} active={c.isActive} />
                </td>
                <td className="px-3 py-2.5">{c.orderCount}</td>
                <td className="px-3 py-2.5 font-medium">{formatPaise(c.totalSpentPaise)}</td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <WhatsAppLink phone={c.phone} name={c.name} compact />
                    <Link href={`/admin/users/${c.id}`} className="text-xs text-brand-600 hover:underline">Edit</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsTab({
  products,
  total,
  brands,
  search,
  onSearch,
}: {
  products: CrmDashboardData["products"];
  total: number;
  brands: CrmDashboardData["brandBreakdown"];
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {brands.slice(0, 4).map((b) => (
          <div key={b.brand} className="bg-white rounded-xl border p-3 shadow-sm">
            <div className="text-xs text-gray-500">{b.brand}</div>
            <div className="text-lg font-bold">{b.productCount} products</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search products, brand, category…"
            className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm"
          />
        </div>
        <p className="text-xs text-gray-500">{products.length} of {total} products</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Product</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Brand</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Department</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Category</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">HSN</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Price</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Variants</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Link href={`/admin/products/${p.slug}/edit`} className="font-medium text-brand-700 hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-xs text-gray-400 font-mono">{p.slug}</div>
                  </td>
                  <td className="px-3 py-2">{p.brand || "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{p.department}</td>
                  <td className="px-3 py-2 text-gray-600">{p.category}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.hsnCode}</td>
                  <td className="px-3 py-2 font-medium">{formatPaise(p.defaultPricePaise)}</td>
                  <td className="px-3 py-2">{p.variationCount}</td>
                  <td className="px-3 py-2">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600")}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CategoriesTab({
  departments,
  categories,
  totalCategories,
  search,
  onSearch,
}: {
  departments: CrmDashboardData["departments"];
  categories: CrmDashboardData["categories"];
  totalCategories: number;
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-600" /> Departments ({departments.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((d) => (
            <div key={d.id} className="rounded-xl border border-gray-100 p-3 hover:border-brand-200 transition-colors">
              <div className="font-semibold text-gray-900">{d.name}</div>
              <div className="text-xs text-gray-500 mt-1">{d.application} · {d.subcategoryCount} subcats · {d.productCount} products</div>
              <Link href={`/categories/${d.slug}`} target="_blank" className="text-xs text-brand-600 hover:underline mt-2 inline-block">
                View on site →
              </Link>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Tags className="w-4 h-4 text-brand-600" /> Subcategories ({totalCategories})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search categories…"
            className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Category</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Department</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Application</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Type</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Products</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Link href={`/categories/${c.slug}`} target="_blank" className="font-medium text-brand-700 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{c.department}</td>
                  <td className="px-3 py-2 text-gray-600">{c.application}</td>
                  <td className="px-3 py-2 text-gray-600">{c.type}</td>
                  <td className="px-3 py-2">{c.productCount}</td>
                  <td className="px-3 py-2">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100")}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterBar({
  search,
  onSearch,
  searchPlaceholder,
  typeFilter,
  onTypeFilter,
  stateFilter,
  onStateFilter,
  states,
  count,
  total,
}: {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  typeFilter: FilterType;
  onTypeFilter: (v: FilterType) => void;
  stateFilter: string;
  onStateFilter: (v: string) => void;
  states: string[];
  count: number;
  total: number;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={typeFilter} onChange={(e) => onTypeFilter(e.target.value as FilterType)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All clients</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="active">Active</option>
          <option value="inactive">Suspended</option>
        </select>
        <select value={stateFilter} onChange={(e) => onStateFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm max-w-[180px]">
          <option value="">All states</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <p className="text-xs text-gray-500 lg:shrink-0">{count} of {total}</p>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-gray-900">
        <Icon className="w-4 h-4 text-brand-600" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}

function TypeBadge({ type, active }: { type: "online" | "offline"; active: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", type === "online" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800")}>
        {type}
      </span>
      {!active && <span className="text-xs text-red-600">Suspended</span>}
    </div>
  );
}
