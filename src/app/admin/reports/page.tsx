import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/utils";
import { Role, PaymentStatus } from "@prisma/client";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";
import { Download, Receipt, Layers, IndianRupee } from "lucide-react";

export const metadata = { title: "Reports" };
export const revalidate = 60;

export default async function AdminReportsPage() {
  const [products, clients, orderStatusGroups, paidAgg, paidOrders, paidItems] =
    await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          name: true,
          defaultPricePaise: true,
          hsnCode: true,
          category: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where: { role: Role.CLIENT, isActive: true } }),
      prisma.order.groupBy({ by: ["status"], _count: true }),
      prisma.order.aggregate({
        _sum: { totalPaise: true, taxPaise: true },
        _count: true,
        where: { paymentStatus: PaymentStatus.PAID },
      }),
      prisma.order.findMany({
        where: { paymentStatus: PaymentStatus.PAID },
        select: { taxPaise: true, totalPaise: true },
      }),
      prisma.orderItem.findMany({
        where: { order: { paymentStatus: PaymentStatus.PAID } },
        select: {
          totalPaise: true,
          quantity: true,
          product: { select: { category: { select: { name: true, parent: { select: { name: true } } } } } },
        },
      }),
    ]);

  const gstCollectedPaise = paidAgg._sum.taxPaise || 0;
  const paidRevenuePaise = paidAgg._sum.totalPaise || 0;

  const categorySales = new Map<
    string,
    { revenuePaise: number; quantity: number }
  >();
  for (const item of paidItems) {
    const cat =
      item.product.category.parent?.name ||
      item.product.category.name ||
      "Uncategorized";
    const existing = categorySales.get(cat) || { revenuePaise: 0, quantity: 0 };
    existing.revenuePaise += item.totalPaise;
    existing.quantity += item.quantity;
    categorySales.set(cat, existing);
  }

  const categoryRows = [...categorySales.entries()]
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenuePaise - a.revenuePaise);

  const categoryTotal = categoryRows.reduce((s, c) => s + c.revenuePaise, 0);

  return (
    <div className="space-y-6 motion-page-admin">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm">
            Business summary, GST, category sales & CSV exports
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CsvDownloadButton
            href="/api/admin/users/export"
            label="Clients CSV"
            className="inline-flex items-center gap-2 px-3 py-2 border border-brand-200 text-brand-700 bg-white rounded-lg text-sm font-medium hover:bg-brand-50"
          />
          <CsvDownloadButton
            href="/api/admin/orders/export"
            label="Orders CSV"
            className="inline-flex items-center gap-2 px-3 py-2 border border-brand-200 text-brand-700 bg-white rounded-lg text-sm font-medium hover:bg-brand-50"
          />
          <CsvDownloadButton href="/api/admin/products/export" label="Products CSV" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5 admin-card">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Download className="w-4 h-4" /> Active B2B Clients
          </div>
          <div className="text-2xl font-bold">{clients}</div>
        </div>
        <div className="bg-white rounded-xl border p-5 admin-card">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Layers className="w-4 h-4" /> Catalog Items
          </div>
          <div className="text-2xl font-bold">{products.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-5 admin-card">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <IndianRupee className="w-4 h-4" /> Paid Revenue
          </div>
          <div className="text-2xl font-bold">{formatPaise(paidRevenuePaise)}</div>
          <div className="text-xs text-gray-400 mt-1">{paidOrders.length} paid orders</div>
        </div>
        <div className="bg-white rounded-xl border p-5 admin-card">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Receipt className="w-4 h-4" /> GST Collected
          </div>
          <div className="text-2xl font-bold text-brand-800">
            {formatPaise(gstCollectedPaise)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Sum of tax on PAID orders</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6 admin-card">
          <h2 className="font-bold text-gray-900 mb-4">Orders by Status</h2>
          <div className="flex flex-wrap gap-3">
            {orderStatusGroups.map((o) => (
              <div key={o.status} className="px-4 py-2 bg-gray-50 rounded-lg text-sm">
                {o.status.replace(/_/g, " ")}: <strong>{o._count}</strong>
              </div>
            ))}
            {orderStatusGroups.length === 0 && (
              <p className="text-gray-500 text-sm">No orders yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 admin-card">
          <h2 className="font-bold text-gray-900 mb-1">Sales by Category</h2>
          <p className="text-xs text-gray-500 mb-4">Paid order line items</p>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {categoryRows.map((c) => {
              const pct =
                categoryTotal > 0
                  ? Math.round((c.revenuePaise / categoryTotal) * 1000) / 10
                  : 0;
              return (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800 truncate pr-2">
                      {c.name}
                    </span>
                    <span className="text-gray-600 shrink-0">
                      {formatPaise(c.revenuePaise)} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.quantity} units</div>
                </div>
              );
            })}
            {categoryRows.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No paid sales yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden admin-card">
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-gray-900">Catalog Price List (Default)</h2>
          <CsvDownloadButton
            href="/api/admin/products/export"
            label="Export full catalog"
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-700 bg-white rounded-lg text-xs font-medium hover:bg-gray-50"
          />
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
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
                  <td className="px-4 py-3 text-right">
                    {formatPaise(p.defaultPricePaise)}
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
