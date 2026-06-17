import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPaise, formatDate } from "@/lib/utils";
import Link from "next/link";
import { AccountSidebar } from "@/components/account/AccountSidebar";

export const metadata = { title: "GST Invoices" };

export default async function AccountInvoicesPage() {
  const session = await requireAuth();

  const invoices = await prisma.invoice.findMany({
    where: { order: { clientId: session.user.id } },
    include: { order: { select: { orderNumber: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">GST Invoices</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <AccountSidebar />
        <div className="lg:col-span-3">
          {invoices.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
              <p>No invoices generated yet.</p>
              <p className="text-sm mt-2">Invoices appear after orders are approved and fulfilled.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Invoice #</th>
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-right px-4 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3">{inv.order.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(inv.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatPaise(inv.totalPaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
