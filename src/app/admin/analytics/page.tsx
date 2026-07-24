import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/utils";
import { DynamicRevenueChart } from "@/components/admin/DynamicRevenueChart";
import { DynamicOrdersTrendChart } from "@/components/admin/DynamicOrdersTrendChart";
import { DynamicPaymentStatusChart } from "@/components/admin/DynamicPaymentStatusChart";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";
import { AnalyticsRangeFilter } from "@/components/admin/AnalyticsRangeFilter";
import { BarChart3, TrendingUp, Package, Users, ShoppingCart } from "lucide-react";
import { PaymentStatus, Role } from "@prisma/client";

export const metadata = { title: "Analytics" };
export const revalidate = 60;

const ALLOWED_DAYS = new Set([30, 90, 365]);

function parseDays(raw: string | undefined): number {
  const n = Number(raw);
  return ALLOWED_DAYS.has(n) ? n : 90;
}

function monthBucket(date: Date): { sortKey: string; label: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const sortKey = `${y}-${String(m + 1).padStart(2, "0")}`;
  const label = date.toLocaleString("en", { month: "short", year: "2-digit" });
  return { sortKey, label };
}

function sortedMonthEntries(map: Record<string, { label: string; value: number }>) {
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

interface Props {
  searchParams: Promise<{ days?: string }>;
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const params = await searchParams;
  const days = parseDays(params.days);
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const dateFilter = { createdAt: { gte: since } };

  const [
    paidOrders,
    allOrdersInRange,
    products,
    clients,
    paymentGroups,
    topItems,
    allClients,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: PaymentStatus.PAID, ...dateFilter },
      select: { totalPaise: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: dateFilter,
      select: { createdAt: true, paymentStatus: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: Role.CLIENT, isActive: true } }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      where: dateFilter,
      _count: true,
    }),
    prisma.orderItem.findMany({
      where: {
        order: { paymentStatus: PaymentStatus.PAID, ...dateFilter },
      },
      select: {
        productId: true,
        quantity: true,
        totalPaise: true,
        productName: true,
      },
    }),
    prisma.user.findMany({
      where: { role: Role.CLIENT },
      include: {
        clientProfile: { select: { company: true, billingState: true } },
        orders: {
          where: { paymentStatus: PaymentStatus.PAID, ...dateFilter },
          select: { totalPaise: true },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const totalRevenuePaise = paidOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const avgOrderPaise =
    paidOrders.length > 0 ? Math.round(totalRevenuePaise / paidOrders.length) : 0;

  const monthlyRevenue: Record<string, { label: string; value: number }> = {};
  const monthlyOrders: Record<string, { label: string; value: number }> = {};

  paidOrders.forEach((o) => {
    const { sortKey, label } = monthBucket(new Date(o.createdAt));
    const entry = monthlyRevenue[sortKey] || { label, value: 0 };
    entry.value += o.totalPaise / 100;
    monthlyRevenue[sortKey] = entry;
  });

  allOrdersInRange.forEach((o) => {
    const { sortKey, label } = monthBucket(new Date(o.createdAt));
    const entry = monthlyOrders[sortKey] || { label, value: 0 };
    entry.value += 1;
    monthlyOrders[sortKey] = entry;
  });

  const productAgg = new Map<
    string,
    { name: string; quantity: number; revenuePaise: number }
  >();
  for (const item of topItems) {
    const existing = productAgg.get(item.productId) || {
      name: item.productName,
      quantity: 0,
      revenuePaise: 0,
    };
    existing.quantity += item.quantity;
    existing.revenuePaise += item.totalPaise;
    productAgg.set(item.productId, existing);
  }

  const topProductDetails = [...productAgg.values()]
    .sort((a, b) => b.revenuePaise - a.revenuePaise)
    .slice(0, 8);

  const topRevenueTotal = topProductDetails.reduce((s, p) => s + p.revenuePaise, 0);

  const paymentBreakdown = (
    [
      PaymentStatus.PAID,
      PaymentStatus.UNPAID,
      PaymentStatus.PENDING_VERIFICATION,
      PaymentStatus.PARTIAL,
      PaymentStatus.FAILED,
      PaymentStatus.REFUNDED,
    ] as const
  ).map((status) => ({
    status,
    count: paymentGroups.find((g) => g.paymentStatus === status)?._count || 0,
  }));

  const rangeLabel =
    days === 30 ? "Last 30 days" : days === 365 ? "Last 12 months" : "Last 90 days";

  const exportHref = `/api/admin/analytics/export?days=${days}`;

  return (
    <div className="space-y-6 motion-page-admin">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm">
            B2B revenue, catalog performance & client insights · {rangeLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Suspense fallback={null}>
            <AnalyticsRangeFilter currentDays={days} />
          </Suspense>
          <div className="flex flex-wrap gap-2">
            <CsvDownloadButton href={exportHref} label="Download Analytics (CSV)" />
            <CsvDownloadButton
              href="/api/admin/users/export"
              label="Download Clients (CSV)"
              className="inline-flex items-center gap-2 px-4 py-2 border border-brand-200 text-brand-700 bg-white rounded-lg text-sm font-medium hover:bg-brand-50"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Paid Revenue",
            value: formatPaise(totalRevenuePaise),
            icon: TrendingUp,
            color: "text-green-600",
          },
          {
            label: "Avg Order Value",
            value: formatPaise(avgOrderPaise),
            icon: BarChart3,
            color: "text-blue-600",
          },
          {
            label: "Orders (range)",
            value: String(allOrdersInRange.length),
            icon: ShoppingCart,
            color: "text-brand-700",
          },
          {
            label: "Active Products",
            value: products.toString(),
            icon: Package,
            color: "text-brand-600",
          },
          {
            label: "B2B Clients",
            value: clients.toString(),
            icon: Users,
            color: "text-orange-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-5 admin-card">
            <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6 admin-card">
          <h2 className="font-bold mb-1">Revenue by Month</h2>
          <p className="text-xs text-gray-500 mb-4">Paid orders only · {rangeLabel}</p>
          <DynamicRevenueChart
            data={sortedMonthEntries(monthlyRevenue).map((m) => ({
              month: m.label,
              revenue: m.value,
            }))}
          />
        </div>
        <div className="bg-white rounded-xl border p-6 admin-card">
          <h2 className="font-bold mb-1">Orders Trend</h2>
          <p className="text-xs text-gray-500 mb-4">All orders placed · {rangeLabel}</p>
          <DynamicOrdersTrendChart
            data={sortedMonthEntries(monthlyOrders).map((m) => ({
              month: m.label,
              orders: m.value,
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6 admin-card">
          <h2 className="font-bold mb-1">Top Sellers by Revenue</h2>
          <p className="text-xs text-gray-500 mb-4">
            Share of paid product revenue · {rangeLabel}
          </p>
          <div className="space-y-3">
            {topProductDetails.map((p, i) => {
              const pct =
                topRevenueTotal > 0
                  ? Math.round((p.revenuePaise / topRevenueTotal) * 1000) / 10
                  : 0;
              return (
                <div key={`${p.name}-${i}`} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium truncate">{p.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPaise(p.revenuePaise)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {p.quantity} sold · {pct}%
                      </div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {topProductDetails.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 admin-card">
          <h2 className="font-bold mb-1">Payment Status</h2>
          <p className="text-xs text-gray-500 mb-4">
            PAID / UNPAID / PENDING_VERIFICATION · {rangeLabel}
          </p>
          <DynamicPaymentStatusChart data={paymentBreakdown} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {paymentBreakdown
              .filter((p) =>
                ["PAID", "UNPAID", "PENDING_VERIFICATION"].includes(p.status)
              )
              .map((p) => (
                <div key={p.status} className="rounded-lg bg-gray-50 px-2 py-2">
                  <div className="text-lg font-bold text-gray-900">{p.count}</div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-500">
                    {p.status.replace(/_/g, " ")}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 admin-card">
        <h2 className="font-bold mb-4">Client Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Client</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Company</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">State</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Orders</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">
                  Spent ({rangeLabel})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allClients.map((c) => {
                const spent = c.orders.reduce((s, o) => s + o.totalPaise, 0);
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="font-medium">{c.name || c.email}</div>
                      <div className="text-xs text-gray-500">{c.email}</div>
                    </td>
                    <td className="px-3 py-2">{c.clientProfile?.company || "—"}</td>
                    <td className="px-3 py-2">{c.clientProfile?.billingState || "—"}</td>
                    <td className="px-3 py-2">{c._count.orders}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatPaise(spent)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
