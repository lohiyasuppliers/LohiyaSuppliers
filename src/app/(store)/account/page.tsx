import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPaise, formatDate, getStatusColor, getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/utils";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountStatCard } from "@/components/account/AccountStatCard";
import {
  Package,
  IndianRupee,
  ArrowRight,
  FileText,
  Gift,
  ShoppingBag,
  Clock,
  Building2,
  Tag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { OrderStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getPayableOrders, summarizePayable, getPendingVerificationOrders, orderBalancePaise, canPayOrder } from "@/lib/payable-orders";
import { PendingPaymentHero, PayOrderButton } from "@/components/account/PendingPaymentAlert";

export const metadata = { title: "My Account" };
export const revalidate = 0;

function profileCompleteness(
  profile: {
    company?: string;
    gstin?: string | null;
    address?: string | null;
    city?: string | null;
    pincode?: string | null;
  } | null | undefined,
  user: { name?: string | null; phone?: string | null } | null | undefined
) {
  const checks = [
    !!user?.name,
    !!user?.phone,
    !!profile?.company,
    !!profile?.gstin,
    !!profile?.address,
    !!profile?.city,
    !!profile?.pincode,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export default async function AccountPage() {
  const session = await requireAuth();
  if (session.user.role === Role.ADMIN) redirect("/admin");

  const userId = session.user.id;

  const [user, orders, orderCount, billCount, pendingCount, spent, priceOverrideCount, payableOrders, verificationOrders] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { clientProfile: true },
      }),
      prisma.order.findMany({
        where: { clientId: userId },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          totalPaise: true,
          paidPaise: true,
          pendingPaymentPaise: true,
          paymentStatus: true,
          status: true,
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.order.count({ where: { clientId: userId } }),
      prisma.clientBill.count({ where: { clientId: userId } }),
      prisma.order.count({
        where: {
          clientId: userId,
          status: {
            in: [
              OrderStatus.PENDING_APPROVAL,
              OrderStatus.APPROVED_PAID,
              OrderStatus.APPROVED_UNPAID,
            ],
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          clientId: userId,
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] },
        },
        _sum: { totalPaise: true },
      }),
      prisma.clientPriceOverride.count({ where: { clientId: userId } }),
      getPayableOrders(userId),
      getPendingVerificationOrders(userId),
    ]);

  const profile = user?.clientProfile;
  const cashbackBalance = profile?.cashbackBalancePaise ?? 0;
  const totalSpent = spent._sum.totalPaise ?? 0;
  const profilePct = profileCompleteness(profile, user);
  const hasCustomPricing = priceOverrideCount > 0;
  const displayName = user?.name || session.user.email?.split("@")[0] || "there";

  const paymentSummary = {
    ...summarizePayable(payableOrders),
    orders: payableOrders,
    verificationOrders,
  };

  const quickActions = [
    { href: "/products", label: "Browse Catalog", icon: ShoppingBag, desc: "Shop abrasives & tools" },
    { href: "/account/orders", label: "Track Orders", icon: Package, desc: "Status & history" },
    { href: "/account/bills", label: "View Bills", icon: FileText, desc: "Download invoices" },
    { href: "/account/profile", label: "Edit Profile", icon: Building2, desc: "Company & GST details" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white p-8 mb-8 animate-fade-in-up shadow-xl shadow-brand-900/10">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-brand-300 rounded-full blur-3xl" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-brand-200 text-sm font-medium uppercase tracking-wider mb-1">
              Client Dashboard
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">Welcome back, {displayName}</h1>
            <p className="text-brand-100 mt-2 max-w-xl">
              {profile?.company
                ? `${profile.company} — manage orders, bills, and your B2B account in one place.`
                : "Manage your B2B orders, bills, and company profile in one place."}
            </p>
            {profile?.gstin && (
              <p className="text-sm text-brand-200 mt-2 font-mono">GSTIN: {profile.gstin}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-900 rounded-xl text-sm font-semibold hover:bg-brand-50 transition-colors shadow-lg"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Catalog
            </Link>
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              My Orders <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <AccountShell>
        {(paymentSummary.totalDuePaise > 0 || verificationOrders.length > 0) && (
          <div className="mb-6" id="outstanding-payments">
            <PendingPaymentHero summary={paymentSummary} />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
          <AccountStatCard
            label="Outstanding Balance"
            value={formatPaise(paymentSummary.totalDuePaise)}
            sub={
              paymentSummary.totalPaidPaise > 0
                ? `${formatPaise(paymentSummary.totalPaidPaise)} already paid`
                : "On approved orders"
            }
            icon={IndianRupee}
            gradient="bg-gradient-to-br from-rose-500 to-orange-600"
            href={paymentSummary.totalDuePaise > 0 ? "/account#outstanding-payments" : undefined}
            delay={0}
          />
          <AccountStatCard
            label="Total Orders"
            value={String(orderCount)}
            sub={pendingCount > 0 ? `${pendingCount} in progress` : "All time"}
            icon={Package}
            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
            href="/account/orders"
            delay={60}
          />
          <AccountStatCard
            label="My Bills"
            value={String(billCount)}
            sub="Uploaded by admin"
            icon={FileText}
            gradient="bg-gradient-to-br from-violet-500 to-violet-700"
            href="/account/bills"
            delay={120}
          />
          <AccountStatCard
            label="Cashback Balance"
            value={formatPaise(cashbackBalance)}
            sub="Earned on orders"
            icon={Gift}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            href="/account/cashback"
            delay={180}
          />
        </div>

        {profilePct < 100 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in-up">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">Complete your company profile ({profilePct}%)</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Add GSTIN, address, and contact details for smoother billing and order processing.
              </p>
              <div className="mt-3 h-2 rounded-full bg-amber-100 overflow-hidden max-w-xs">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${profilePct}%` }}
                />
              </div>
            </div>
            <Link
              href="/account/profile"
              className="inline-flex items-center gap-1 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 shrink-0"
            >
              Complete profile <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-gray-900">Recent Orders</h2>
                <Link href="/account/orders" className="text-sm text-brand-600 font-medium hover:underline">
                  View all
                </Link>
              </div>
              {orders.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  <Package className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="font-medium text-gray-700">No orders yet</p>
                  <p className="text-sm mt-1">Start browsing our industrial catalog.</p>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-1 mt-4 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700"
                  >
                    Browse catalog <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const balance = orderBalancePaise(order);
                    const showPay = canPayOrder(order);

                    return (
                    <div
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-5 hover:bg-gray-50/80 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                          {order.orderNumber}
                          <Link
                            href={`/account/orders/${order.id}/bill`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                          >
                            <FileText className="w-3 h-3" />
                            Bill
                          </Link>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(order.createdAt)}
                          </span>
                          <span>·</span>
                          <span>{order._count.items} items</span>
                        </div>
                        {order.paidPaise > 0 && order.paymentStatus !== "PAID" && (
                          <p className="text-xs text-emerald-700 mt-1.5 font-medium">
                            {formatPaise(order.paidPaise)} paid · {formatPaise(balance)} remaining
                          </p>
                        )}
                        {order.pendingPaymentPaise > 0 && (
                          <p className="text-xs text-violet-700 mt-1 font-medium">
                            {formatPaise(order.pendingPaymentPaise)} awaiting verification
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-brand-900">{formatPaise(order.totalPaise)}</div>
                        <div className="flex gap-2 mt-2 justify-end flex-wrap">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}
                          >
                            {getOrderStatusLabel(order.status)}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.paymentStatus)}`}
                          >
                            {getPaymentStatusLabel(order.paymentStatus)}
                          </span>
                        </div>
                        {showPay && (
                          <div className="mt-3">
                            <PayOrderButton
                              orderId={order.id}
                              orderNumber={order.orderNumber}
                              balancePaise={balance}
                              totalPaise={order.totalPaise}
                              paidPaise={order.paidPaise}
                              allOrders={payableOrders}
                              totalDuePaise={paymentSummary.totalDuePaise}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-fade-in-up">
              <h2 className="font-bold text-gray-900 mb-4">Company Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  ["Company", profile?.company],
                  ["Billing State", profile?.billingState],
                  ["Phone", user?.phone],
                  ["City", profile?.city],
                  ["Address", profile?.address],
                  ["Email", user?.email],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-xl bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{k}</p>
                    <p className="font-medium text-gray-900 mt-0.5 truncate">{v || "—"}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/account/profile"
                className="inline-flex items-center gap-1 text-sm text-brand-600 font-medium mt-5 hover:underline"
              >
                Edit profile <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-brand-950 to-brand-800 rounded-2xl p-6 text-white shadow-lg animate-fade-in-up">
              <div className="flex items-center gap-2 text-brand-200 text-sm mb-2">
                <Tag className="w-4 h-4" /> B2B Pricing
              </div>
              {hasCustomPricing ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <h3 className="font-semibold">Custom rates active</h3>
                  </div>
                  <p className="text-brand-100 text-sm leading-relaxed">
                    You have {priceOverrideCount} negotiated price
                    {priceOverrideCount === 1 ? "" : "s"} on your account. Your rates apply at
                    checkout.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold mb-2">List prices shown</h3>
                  <p className="text-brand-100 text-sm leading-relaxed">
                    Browse the catalog for default prices. Contact us for negotiated B2B rates on
                    your account.
                  </p>
                </>
              )}
              <Link
                href="/products"
                className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-white hover:text-brand-100"
              >
                Shop now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in-up">
              <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/50 transition-all group"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100">
                      <action.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                      <p className="text-xs text-gray-500">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-brand-600 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AccountShell>
    </div>
  );
}
