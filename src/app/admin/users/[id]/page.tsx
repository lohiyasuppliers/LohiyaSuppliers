import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { UserRoleBadge } from "@/components/admin/UserRoleBadge";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      clientProfile: true,
      orders: { orderBy: { createdAt: "desc" }, take: 10 },
      priceOverrides: { include: { product: { select: { name: true } } }, take: 10 },
    },
  });

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Link>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name || user.email}</h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
          <UserRoleBadge role={user.role} />
        </div>

        {user.clientProfile && (
          <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
            <div>
              <span className="text-gray-500">Company:</span>{" "}
              <span className="font-medium">{user.clientProfile.company}</span>
            </div>
            <div>
              <span className="text-gray-500">GSTIN:</span>{" "}
              <span className="font-medium">{user.clientProfile.gstin || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Billing State:</span>{" "}
              <span className="font-medium">{user.clientProfile.billingState}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>{" "}
              <span className="font-medium">{user.phone || "—"}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold mb-4">Recent Orders ({user.orders.length})</h2>
          {user.orders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders</p>
          ) : (
            <div className="space-y-2">
              {user.orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="block p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100"
                >
                  {o.orderNumber} · {formatDate(o.createdAt)}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold mb-4">Price Overrides ({user.priceOverrides.length})</h2>
          {user.priceOverrides.length === 0 ? (
            <p className="text-sm text-gray-500">Using default catalog prices</p>
          ) : (
            <div className="space-y-2">
              {user.priceOverrides.map((po) => (
                <div key={po.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                  {po.product.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
