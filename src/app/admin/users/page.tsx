import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Eye, UserCog } from "lucide-react";
import { UserRoleBadge } from "@/components/admin/UserRoleBadge";
import { Role } from "@prisma/client";

export const metadata = { title: "Clients" };
export const revalidate = 30;

export default async function UserManagementPage() {
  const users = await prisma.user.findMany({
    include: {
      clientProfile: { select: { company: true, billingState: true, gstin: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    clients: users.filter((u) => u.role === Role.CLIENT).length,
    admins: users.filter((u) => u.role === Role.ADMIN).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserCog className="w-7 h-7 text-brand-600" />
          B2B Clients
        </h1>
        <p className="text-gray-500 text-sm">Manage client accounts and per-client pricing</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Accounts", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Clients", value: stats.clients },
          { label: "Admins", value: stats.admins },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Account</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">State</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Orders</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{user.name || "—"}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </td>
                <td className="px-4 py-3">{user.clientProfile?.company || "—"}</td>
                <td className="px-4 py-3 text-gray-600">
                  {user.clientProfile?.billingState || "—"}
                </td>
                <td className="px-4 py-3">
                  <UserRoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3">{user._count.orders}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="inline-flex items-center gap-1 text-brand-600 hover:underline text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
