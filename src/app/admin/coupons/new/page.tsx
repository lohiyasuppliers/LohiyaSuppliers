import { prisma } from "@/lib/prisma";
import { CouponForm } from "@/components/admin/CouponForm";
import Link from "next/link";
import { Role } from "@prisma/client";

export const metadata = { title: "New Voucher" };

export default async function NewCouponPage() {
  const clients = await prisma.user.findMany({
    where: { role: Role.CLIENT },
    select: {
      id: true,
      name: true,
      email: true,
      clientProfile: { select: { company: true } },
    },
    orderBy: { email: "asc" },
  });

  return (
    <div className="space-y-6 admin-fade-in">
      <div>
        <Link href="/admin/coupons" className="text-sm text-brand-600 hover:underline">
          ← Coupons
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Client Voucher</h1>
      </div>
      {clients.length === 0 ? (
        <p className="text-sm text-gray-500">Create a client account before assigning vouchers.</p>
      ) : (
        <CouponForm clients={clients} />
      )}
    </div>
  );
}
