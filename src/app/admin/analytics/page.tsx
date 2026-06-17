import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/utils";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { BarChart3, TrendingUp, Package, Users } from "lucide-react";
import { Role } from "@prisma/client";

export const metadata = { title: "Analytics" };
export const revalidate = 60;

export default async function AdminAnalyticsPage() {
  const [orders, products, clients, topProducts] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: "PAID" },
      select: { totalPaise: true, createdAt: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: Role.CLIENT, isActive: true } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const totalRevenuePaise = orders.reduce((sum, o) => sum + o.totalPaise, 0);
  const avgOrderPaise = orders.length > 0 ? Math.round(totalRevenuePaise / orders.length) : 0;

  const monthlyRevenue: Record<string, number> = {};
  orders.forEach((o) => {
    const month = new Date(o.createdAt).toLocaleString("en", {
      month: "short",
      year: "2-digit",
    });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + o.totalPaise / 100;
  });

  const topProductDetails = await Promise.all(
    topProducts.map(async (tp) => {
      const product = await prisma.product.findUnique({
        where: { id: tp.productId },
        select: { name: true },
      });
      return { name: product?.name || "Unknown", quantity: tp._sum.quantity || 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm">B2B revenue and catalog performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
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
            label: "Active Products",
            value: products.toString(),
            icon: Package,
            color: "text-purple-600",
          },
          {
            label: "B2B Clients",
            value: clients.toString(),
            icon: Users,
            color: "text-orange-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-5">
            <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold mb-4">Revenue Trend</h2>
          <RevenueChart
            data={Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }))}
          />
        </div>
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {topProductDetails.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                <span className="text-sm text-gray-500">{p.quantity} sold</span>
              </div>
            ))}
            {topProductDetails.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
