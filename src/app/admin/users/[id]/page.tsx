import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatPaise } from "@/lib/utils";
import { UserRoleBadge } from "@/components/admin/UserRoleBadge";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";
import { AdminBillManager } from "@/components/admin/AdminBillManager";
import { ClientPricingManager } from "@/components/admin/ClientPricingManager";
import { ClientCashbackManager } from "@/components/admin/ClientCashbackManager";
import { ClientDiscountManager } from "@/components/admin/ClientDiscountManager";
import { UserAccountActions } from "@/components/admin/UserAccountActions";
import { getSession } from "@/lib/session";
import { ArrowLeft } from "lucide-react";
import { Role } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const [user, bills] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        clientProfile: true,
        orders: { orderBy: { createdAt: "desc" }, take: 20 },
        priceOverrides: {
          include: { product: { select: { name: true } } },
          orderBy: { updatedAt: "desc" },
          take: 20,
        },
      },
    }),
    prisma.clientBill.findMany({
      where: { clientId: id },
      orderBy: { billDate: "desc" },
    }),
  ]);

  if (!user) notFound();

  const paidOrders = user.orders.filter((o) => o.paymentStatus === "PAID");
  const totalSpent = paidOrders.reduce((s, o) => s + o.totalPaise, 0);
  const avgOrder = paidOrders.length > 0 ? Math.round(totalSpent / paidOrders.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Link>
        {user.role === Role.CLIENT && (
          <CsvDownloadButton
            href={`/api/admin/users/export?userId=${user.id}`}
            label="Download Client Data (CSV)"
          />
        )}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name || user.email}</h1>
            <p className="text-gray-500">{user.email}</p>
            {user.phone && <p className="text-sm text-gray-500 mt-1">{user.phone}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {user.isActive ? "Active" : "Suspended"}
              </span>
            </div>
          </div>
          <UserRoleBadge role={user.role} />
        </div>

        {user.role === Role.CLIENT && (
          <UserAccountActions
            userId={user.id}
            email={user.email}
            isActive={user.isActive}
            role={user.role}
            canManage={session?.user?.id !== user.id}
            redirectOnDelete
          />
        )}

        {user.role === Role.CLIENT && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total Orders", value: String(user.orders.length) },
              { label: "Total Spent", value: formatPaise(totalSpent) },
              { label: "Avg Order", value: formatPaise(avgOrder) },
              { label: "Status", value: user.isActive ? "Active" : "Inactive" },
            ].map((s) => (
              <div key={s.label} className="p-3 bg-brand-50/50 rounded-xl border border-brand-100">
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className="font-bold text-gray-900 mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {user.clientProfile && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm border-t pt-6">
            <div>
              <span className="text-gray-500">Company:</span>{" "}
              <span className="font-medium">{user.clientProfile.company}</span>
            </div>
            <div>
              <span className="text-gray-500">GSTIN:</span>{" "}
              <span className="font-medium font-mono">{user.clientProfile.gstin || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Contact Person:</span>{" "}
              <span className="font-medium">{user.name || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Contact Number:</span>{" "}
              <span className="font-medium">{user.phone || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Billing State:</span>{" "}
              <span className="font-medium">{user.clientProfile.billingState}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-gray-500">Address:</span>{" "}
              <span className="font-medium">
                {[user.clientProfile.address, user.clientProfile.city, user.clientProfile.pincode]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Joined:</span>{" "}
              <span className="font-medium">{formatDate(user.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-500">Cashback Balance:</span>{" "}
              <span className="font-medium">
                {formatPaise(user.clientProfile.cashbackBalancePaise)}
              </span>
            </div>
          </div>
        )}
      </div>

      {user.role === Role.CLIENT && (
        <>
          <ClientDiscountManager clientId={user.id} />
          <ClientPricingManager clientId={user.id} />
          <ClientCashbackManager clientId={user.id} />
          <AdminBillManager
            clientId={user.id}
            initialBills={bills.map((b) => ({
              ...b,
              billDate: b.billDate.toISOString(),
            }))}
          />
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold mb-4">Order History ({user.orders.length})</h2>
          {user.orders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders</p>
          ) : (
            <div className="space-y-2">
              {user.orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100"
                >
                  <span>{o.orderNumber}</span>
                  <span className="text-gray-500">
                    {formatPaise(o.totalPaise)} · {formatDate(o.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold mb-4">Active Custom Prices ({user.priceOverrides.length})</h2>
          {user.priceOverrides.length === 0 ? (
            <p className="text-sm text-gray-500">No custom prices — use B2B Custom Pricing above.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {user.priceOverrides.map((po) => (
                <div key={po.id} className="flex justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <span>{po.product.name}</span>
                  <span className="font-medium text-brand-700">{formatPaise(po.pricePaise)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
