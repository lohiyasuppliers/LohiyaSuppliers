import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate, formatPaise } from "@/lib/utils";
import { Eye, UserCog } from "lucide-react";
import { UserRoleBadge } from "@/components/admin/UserRoleBadge";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";
import { UserAccountActions } from "@/components/admin/UserAccountActions";
import { getSession } from "@/lib/session";
import { Role } from "@prisma/client";

export const metadata = { title: "Clients" };
export const revalidate = 30;

export default async function UserManagementPage() {
  const session = await getSession();
  const users = await prisma.user.findMany({
    include: {
      clientProfile: {
        select: { company: true, billingState: true, gstin: true },
      },
      _count: { select: { orders: true } },
      orders: {
        where: { paymentStatus: "PAID" },
        select: { totalPaise: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const clients = users.filter((u) => u.role === Role.CLIENT);

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    clients: clients.length,
    admins: users.filter((u) => u.role === Role.ADMIN).length,
    totalRevenue: clients.reduce(
      (sum, u) => sum + u.orders.reduce((s, o) => s + o.totalPaise, 0),
      0
    ),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="w-7 h-7 text-brand-600" />
            B2B Clients
          </h1>
          <p className="text-gray-500 text-sm">View, manage, and download client data</p>
        </div>
        <CsvDownloadButton
          href="/api/admin/users/export"
          label="Download All Clients (CSV)"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Accounts", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "B2B Clients", value: stats.clients },
          { label: "Admins", value: stats.admins },
          { label: "Client Revenue", value: formatPaise(stats.totalRevenue) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Account</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Contact No.</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">GSTIN</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">State</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Orders</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Total Spent</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => {
              const totalSpent = user.orders.reduce((s, o) => s + o.totalPaise, 0);
              return (
                <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? "bg-red-50/40" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{user.name || "—"}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.phone || "—"}</td>
                  <td className="px-4 py-3">{user.clientProfile?.company || "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">
                    {user.clientProfile?.gstin || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.clientProfile?.billingState || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{user._count.orders}</td>
                  <td className="px-4 py-3 font-medium text-brand-800">
                    {user.role === Role.CLIENT ? formatPaise(totalSpent) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-1 text-brand-600 hover:underline text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                      {user.role === Role.CLIENT && (
                        <UserAccountActions
                          userId={user.id}
                          email={user.email}
                          isActive={user.isActive}
                          role={user.role}
                          canManage={session?.user?.id !== user.id}
                          compact
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
