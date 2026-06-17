import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPaise, formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { Package, FileText, Building2, IndianRupee, Wallet, ArrowRight } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export const metadata = { title: "My Account" };

export default async function AccountPage() {
  const session = await requireAuth();
  if (session.user.role === Role.ADMIN) redirect("/admin");

  const userId = session.user.id;

  const [user, orders, orderCount, invoiceCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { clientProfile: true },
    }),
    prisma.order.findMany({
      where: { clientId: userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.order.count({ where: { clientId: userId } }),
    prisma.invoice.count({ where: { order: { clientId: userId } } }),
  ]);

  const profile = user?.clientProfile;
  const cashbackBalance = profile?.cashbackBalancePaise ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back{profile?.company ? `, ${profile.company}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <AccountSidebar />

        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Orders", value: orderCount, icon: Package, href: "/account/orders" },
              { label: "GST Invoices", value: invoiceCount, icon: FileText, href: "/account/invoices" },
              {
                label: "Cashback Balance",
                value: formatPaise(cashbackBalance),
                icon: Wallet,
                href: "/account",
              },
              {
                label: "Company",
                value: profile?.company || "—",
                icon: Building2,
                href: "/account/profile",
              },
            ].map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="bg-white rounded-xl border p-5 hover:shadow-md hover:border-brand-200 transition-all"
              >
                <s.icon className="w-5 h-5 text-brand-600 mb-2" />
                <div className="text-xl font-bold text-gray-900 truncate">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </Link>
            ))}
          </div>

          <div className="bg-gradient-to-r from-brand-950 to-brand-800 rounded-xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-brand-200 text-sm mb-1">
                  <IndianRupee className="w-4 h-4" /> B2B Pricing
                </div>
                <h2 className="text-lg font-semibold">Your custom prices are set by admin</h2>
                <p className="text-brand-200 text-sm mt-1 max-w-lg">
                  Browse the catalog to see default prices. Your negotiated rates apply at checkout
                  once configured for your account.
                </p>
              </div>
              <Link
                href="/products"
                className="px-4 py-2 bg-white text-brand-900 text-sm font-medium rounded-lg hover:bg-brand-50 shrink-0"
              >
                Browse Catalog
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold text-gray-900 mb-4">Company Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                ["Company", profile?.company],
                ["GSTIN", profile?.gstin],
                ["Billing State", profile?.billingState],
                ["Phone", user?.phone],
                ["Address", profile?.address],
                ["City", profile?.city],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <span className="text-gray-500">{k}:</span>{" "}
                  <span className="font-medium">{v || "—"}</span>
                </div>
              ))}
            </div>
            <Link
              href="/account/profile"
              className="inline-flex items-center gap-1 text-sm text-brand-600 mt-4 hover:underline"
            >
              Edit profile <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Recent Orders</h2>
              <Link href="/account/orders" className="text-sm text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            {orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No orders yet.</p>
                <Link href="/products" className="text-brand-600 text-sm mt-2 inline-block">
                  Browse catalog →
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {orders.map((order) => (
                  <div key={order.id} className="p-5 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(order.createdAt)} · {formatPaise(order.totalPaise)} ·{" "}
                        {order.orderType}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
