import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatPaise, formatDateTime } from "@/lib/utils";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { CatalogOverview } from "@/components/admin/CatalogOverview";
import { Role } from "@prisma/client";

export const revalidate = 30;

async function getDashboardStats() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalProducts,
    totalVariations,
    totalOrders,
    totalClients,
    pendingApproval,
    paidOrders,
    recentOrders,
    catalogProducts,
    thisMonthOrders,
    lastMonthOrders,
    revenueAgg,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariation.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: Role.CLIENT, isActive: true } }),
    prisma.order.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.order.findMany({
      where: { paymentStatus: "PAID" },
      select: { totalPaise: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
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
    prisma.order.findMany({
      where: { createdAt: { gte: thisMonthStart }, paymentStatus: "PAID" },
      select: { totalPaise: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, paymentStatus: "PAID" },
      select: { totalPaise: true },
    }),
    prisma.order.aggregate({
      _sum: { totalPaise: true },
      where: { paymentStatus: "PAID" },
    }),
  ]);

  const monthlyRevenue: Record<string, number> = {};
  paidOrders.forEach((o) => {
    const key = new Date(o.createdAt).toLocaleString("en", { month: "short", year: "2-digit" });
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + o.totalPaise / 100;
  });

  const thisMonthRevenue = thisMonthOrders.reduce((s, o) => s + o.totalPaise, 0);
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + o.totalPaise, 0);
  const revenueChange =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : thisMonthRevenue > 0
        ? 100
        : 0;

  const avgOrderPaise =
    paidOrders.length > 0
      ? Math.round(paidOrders.reduce((s, o) => s + o.totalPaise, 0) / paidOrders.length)
      : 0;

  return {
    totalProducts,
    totalVariations,
    totalOrders,
    totalClients,
    pendingApproval,
    totalRevenuePaise: revenueAgg._sum.totalPaise || 0,
    thisMonthRevenuePaise: thisMonthRevenue,
    revenueChange,
    avgOrderPaise,
    recentOrders,
    catalogProducts,
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    })),
  };
}

export default async function AdminDashboard() {
  await requireAdmin();
  const stats = await getDashboardStats();

  const statCards = [
    {
      label: "Total Revenue",
      value: formatPaise(stats.totalRevenuePaise),
      sub: `${formatPaise(stats.thisMonthRevenuePaise)} this month`,
      icon: DollarSign,
      color: "bg-emerald-600",
      badge:
        stats.revenueChange !== 0
          ? `${stats.revenueChange > 0 ? "+" : ""}${stats.revenueChange}% vs last month`
          : "No prior month data",
      badgeColor:
        stats.revenueChange >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50",
    },
    {
      label: "Orders",
      value: stats.totalOrders.toString(),
      sub: `${stats.pendingApproval} awaiting approval`,
      icon: ShoppingCart,
      color: "bg-blue-600",
      badge: stats.pendingApproval > 0 ? "Action needed" : "All caught up",
      badgeColor:
        stats.pendingApproval > 0 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Catalog",
      value: stats.totalProducts.toString(),
      sub: `${stats.totalVariations} active variations`,
      icon: Package,
      color: "bg-violet-600",
      badge: "Products & services",
      badgeColor: "text-gray-600 bg-gray-100",
    },
    {
      label: "B2B Clients",
      value: stats.totalClients.toString(),
      sub: `Avg order ${formatPaise(stats.avgOrderPaise)}`,
      icon: Users,
      color: "bg-orange-600",
      badge: "Active accounts",
      badgeColor: "text-gray-600 bg-gray-100",
    },
  ];

  const quickActions = [
    { href: "/admin/products/new", label: "Add Product", desc: "New catalog item" },
    { href: "/admin/categories/new", label: "Add Category", desc: "Product or service" },
    { href: "/admin/orders", label: "Manage Orders", desc: "Approve & fulfill" },
    { href: "/admin/users", label: "Client List", desc: "B2B accounts" },
    { href: "/admin/settings", label: "Platform Settings", desc: "GST & business info" },
    { href: "/admin/analytics", label: "Analytics", desc: "Revenue trends" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">B2B Command Center</h1>
          <p className="text-gray-500 text-sm">
            Per-client pricing · prepaid/postpaid orders · GST invoicing
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {stats.pendingApproval > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-900">
              {stats.pendingApproval} order{stats.pendingApproval > 1 ? "s" : ""} pending approval
            </p>
            <p className="text-sm text-amber-700">Review and approve client orders to proceed.</p>
          </div>
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
          >
            Review Orders
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">{card.label}</div>
            <div className="text-xs text-gray-500 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Revenue by Month</h2>
            <Link href="/admin/analytics" className="text-xs text-brand-600 hover:underline">
              Full analytics →
            </Link>
          </div>
          <RevenueChart data={stats.monthlyRevenue} />
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand-600" /> Latest Catalog
            </h2>
            <Link href="/admin/products" className="text-xs text-brand-600 hover:underline">
              Manage
            </Link>
          </div>
          <CatalogOverview products={stats.catalogProducts} />
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <RecentOrders orders={stats.recentOrders} />
      </div>

      <div>
        <h2 className="font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white rounded-xl border p-4 hover:shadow-md hover:border-brand-200 transition-all group"
            >
              <div className="text-sm font-semibold text-gray-900 group-hover:text-brand-700">
                {action.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">{action.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
