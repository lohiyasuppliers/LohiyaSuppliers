import { prisma } from "@/lib/prisma";
import { CouponForm } from "@/components/admin/CouponForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";

export const metadata = { title: "Edit Voucher" };

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [voucher, clients] = await Promise.all([
    prisma.clientVoucher.findUnique({ where: { id } }),
    prisma.user.findMany({
      where: { role: Role.CLIENT },
      select: {
        id: true,
        name: true,
        email: true,
        clientProfile: { select: { company: true } },
      },
      orderBy: { email: "asc" },
    }),
  ]);

  if (!voucher) notFound();

  return (
    <div className="space-y-6 admin-fade-in">
      <div>
        <Link href="/admin/coupons" className="text-sm text-brand-600 hover:underline">
          ← Coupons
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Voucher</h1>
      </div>
      <CouponForm clients={clients} initial={voucher} />
    </div>
  );
}
