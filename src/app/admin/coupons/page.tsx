import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatPaise } from "@/lib/utils";
import { CouponActions } from "@/components/admin/CouponActions";

export const metadata = { title: "Coupons & Vouchers" };
export const revalidate = 0;

export default async function AdminCouponsPage() {
  const vouchers = await prisma.clientVoucher.findMany({
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
  });

  return (
    <div className="space-y-6 admin-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Vouchers</h1>
          <p className="text-gray-500 text-sm">{vouchers.length} vouchers</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" /> Add Voucher
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Uses</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  No client vouchers yet.
                </td>
              </tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900">{v.code}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {v.client.clientProfile?.company || v.client.name || "—"}
                    </div>
                    <div className="text-xs text-gray-500">{v.client.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {v.type === "FIXED"
                      ? formatPaise(v.valuePaise || 0)
                      : `${((v.valueBps || 0) / 100).toFixed(0)}%`}
                    <span className="text-xs text-gray-400 ml-1">· {v.scope.replace(/_/g, " ")}</span>
                    {v.minOrderPaise > 0 && (
                      <div className="text-xs text-gray-400">Min {formatPaise(v.minOrderPaise)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {v.usedCount}
                    {v.maxUses != null ? ` / ${v.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        v.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {v.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/admin/coupons/${v.id}/edit`}
                        className="px-2 py-1 text-xs font-medium text-brand-700 hover:underline"
                      >
                        Edit
                      </Link>
                      <CouponActions couponId={v.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
