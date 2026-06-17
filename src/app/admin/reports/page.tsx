import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/utils";
import { Role } from "@prisma/client";

export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const [products, clients, orders, paidRevenue] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { name: true, defaultPricePaise: true, hsnCode: true, category: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.count({ where: { role: Role.CLIENT, isActive: true } }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.aggregate({
      _sum: { totalPaise: true },
      where: { paymentStatus: "PAID" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm">Business summary and catalog overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="text-2xl font-bold">{clients}</div>
          <div className="text-sm text-gray-500">Active B2B Clients</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-2xl font-bold">{products.length}</div>
          <div className="text-sm text-gray-500">Catalog Items</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-2xl font-bold">{formatPaise(paidRevenue._sum.totalPaise || 0)}</div>
          <div className="text-sm text-gray-500">Total Paid Revenue</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-gray-900 mb-4">Orders by Status</h2>
        <div className="flex flex-wrap gap-3">
          {orders.map((o) => (
            <div key={o.status} className="px-4 py-2 bg-gray-50 rounded-lg text-sm">
              {o.status.replace(/_/g, " ")}: <strong>{o._count}</strong>
            </div>
          ))}
          {orders.length === 0 && <p className="text-gray-500 text-sm">No orders yet</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-900">Catalog Price List (Default)</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">HSN</th>
              <th className="text-right px-4 py-3">Default Price</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.name}>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.category.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.hsnCode}</td>
                <td className="px-4 py-3 text-right">{formatPaise(p.defaultPricePaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
