import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/utils";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { DynamicRevenueChart } from "@/components/admin/DynamicRevenueChart";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { CatalogOverview } from "@/components/admin/CatalogOverview";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { PendingPaymentsPanel } from "@/components/admin/PendingPaymentsPanel";
import { PendingOrderApprovalsPanel } from "@/components/admin/PendingOrderApprovalsPanel";
import { getAdminPendingPayments, getAdminPendingOrderApprovals } from "@/lib/payable-orders";
import { Role } from "@prisma/client";

export const revalidate = 60;

async function getDashboardStats() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const chartStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    totalProducts,
    totalVariations,
    totalOrders,
    totalClients,
    pendingApproval,
    recentOrders,
    catalogProducts,
    thisMonthRevenue,
    lastMonthRevenue,
    revenueAgg,
    avgOrderAgg,
    chartOrders,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariation.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: Role.CLIENT, isActive: true } }),
    prisma.order.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.order.findMany({
      include: {
        client: {
          select: {
            name: true,
            email: true,
            clientProfile: { select: { company: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        defaultPricePaise: true,
        category: { select: { name: true } },
        _count: { select: { variations: true } },
      },
    }),
    prisma.order.aggregate({
      _sum: { totalPaise: true },
      where: { createdAt: { gte: thisMonthStart }, paymentStatus: "PAID" },
    }),
    prisma.order.aggregate({
      _sum: { totalPaise: true },
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, paymentStatus: "PAID" },
    }),
    prisma.order.aggregate({
      _sum: { totalPaise: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.order.aggregate({
      _avg: { totalPaise: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: chartStart } },
      select: { totalPaise: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const monthlyRevenue: Record<string, number> = {};
  chartOrders.forEach((o) => {
    const key = new Date(o.createdAt).toLocaleString("en", { month: "short", year: "2-digit" });
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + o.totalPaise / 100;
  });

  const thisMonthRevenuePaise = thisMonthRevenue._sum.totalPaise || 0;
  const lastMonthRevenuePaise = lastMonthRevenue._sum.totalPaise || 0;
  const revenueChange =
    lastMonthRevenuePaise > 0
      ? Math.round(((thisMonthRevenuePaise - lastMonthRevenuePaise) / lastMonthRevenuePaise) * 100)
      : thisMonthRevenuePaise > 0
        ? 100
        : 0;

  return {
    totalProducts,
    totalVariations,
    totalOrders,
    totalClients,
    pendingApproval,
    totalRevenuePaise: revenueAgg._sum.totalPaise || 0,
    thisMonthRevenuePaise,
    revenueChange,
    avgOrderPaise: Math.round(avgOrderAgg._avg.totalPaise || 0),
    recentOrders,
    catalogProducts,
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    })),
  };
}

export default async function AdminDashboard() {
  const [stats, pendingPayments, pendingOrderApprovals] = await Promise.all([
    getDashboardStats(),
    getAdminPendingPayments(),
    getAdminPendingOrderApprovals(),
  ]);

  const statCards = [
    {
      label: "Total Revenue",
      value: formatPaise(stats.totalRevenuePaise),
      sub: `${formatPaise(stats.thisMonthRevenuePaise)} this month`,
      icon: DollarSign,
      gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
      badge:
        stats.revenueChange !== 0
          ? `${stats.revenueChange > 0 ? "+" : ""}${stats.revenueChange}% vs last month`
          : "No prior data",
      badgeTone: (stats.revenueChange >= 0 ? "success" : "warning") as "success" | "warning",
    },
    {
      label: "Orders",
      value: stats.totalOrders.toString(),
      sub: `${stats.pendingApproval} awaiting approval`,
      icon: ShoppingCart,
      gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
      badge:
        pendingPayments.length > 0
          ? `${pendingPayments.length} payment${pendingPayments.length > 1 ? "s" : ""} to verify`
          : stats.pendingApproval > 0
            ? "Action needed"
            : "All caught up",
      badgeTone:
        pendingPayments.length > 0 || stats.pendingApproval > 0
          ? ("warning" as const)
          : ("success" as const),
    },
    {
      label: "Catalog",
      value: stats.totalProducts.toString(),
      sub: `${stats.totalVariations} active variants`,
      icon: Package,
      gradient: "bg-gradient-to-br from-violet-500 to-purple-600",
      badge: "Products & tools",
      badgeTone: "neutral" as const,
    },
    {
      label: "B2B Clients",
      value: stats.totalClients.toString(),
      sub: `Avg order ${formatPaise(stats.avgOrderPaise)}`,
      icon: Users,
      gradient: "bg-gradient-to-br from-orange-500 to-amber-600",
      badge: "Active accounts",
      badgeTone: "neutral" as const,
    },
  ];

  const quickActions = [
    { href: "/admin/products/new", label: "Add Product", desc: "New catalog item", color: "hover:border-violet-200 hover:bg-violet-50" },
    { href: "/admin/categories/new", label: "Add Category", desc: "Metal or wood dept", color: "hover:border-blue-200 hover:bg-blue-50" },
    { href: "/admin/orders", label: "Manage Orders", desc: "Approve & fulfill", color: "hover:border-emerald-200 hover:bg-emerald-50" },
    { href: "/admin/users", label: "Client List", desc: "B2B accounts", color: "hover:border-orange-200 hover:bg-orange-50" },
    { href: "/admin/settings", label: "Settings", desc: "GST & business info", color: "hover:border-slate-200 hover:bg-slate-50" },
    { href: "/admin/analytics", label: "Analytics", desc: "Revenue trends", color: "hover:border-cyan-200 hover:bg-cyan-50" },
  ];

  return (
    <div className="admin-fade-in space-y-6">
      <div className="admin-hero relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-950 via-brand-800 to-brand-600 p-6 text-white md:p-8">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-10 right-10 h-40 w-40 rounded-full bg-white blur-3xl animate-float" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-brand-300 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-brand-200 text-sm">
              <Sparkles className="h-4 w-4" />
              B2B Command Center
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Dashboard</h1>
            <p className="mt-1 text-brand-100 text-sm md:text-base">
              Per-client pricing · prepaid/postpaid orders · GST invoicing
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm backdrop-blur-sm">
            <Clock className="h-4 w-4 text-brand-200" />
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {stats.pendingApproval > 0 && (
        <div className="admin-slide-up flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">
              {stats.pendingApproval} order{stats.pendingApproval > 1 ? "s" : ""} pending approval
            </p>
            <p className="text-sm text-amber-700">Review and approve client orders to proceed.</p>
          </div>
          <Link
            href="/admin/orders?filter=pending_approval"
            className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-amber-700 hover:shadow-lg"
          >
            Review Orders
          </Link>
        </div>
      )}

      <PendingOrderApprovalsPanel orders={pendingOrderApprovals} />

      <PendingPaymentsPanel orders={pendingPayments} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <AdminStatCard key={card.label} {...card} delay={i * 80} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="admin-card lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Revenue by Month</h2>
            <Link href="/admin/analytics" className="text-xs font-medium text-brand-600 hover:underline">
              Full analytics →
            </Link>
          </div>
          <DynamicRevenueChart data={stats.monthlyRevenue} />
        </div>
        <div className="admin-card rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Latest Catalog</h2>
            <Link href="/admin/products" className="text-xs font-medium text-brand-600 hover:underline">
              Manage
            </Link>
          </div>
          <CatalogOverview products={stats.catalogProducts} />
        </div>
      </div>

      <div className="admin-card rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <RecentOrders orders={stats.recentOrders} />
      </div>

      <div>
        <h2 className="mb-3 font-bold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
              className={`admin-card group rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${action.color}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                  {action.label}
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-brand-500" />
              </div>
              <div className="mt-1 text-xs text-slate-500">{action.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
