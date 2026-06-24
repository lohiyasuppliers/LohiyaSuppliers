import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buildOrderBill } from "@/lib/order-bill";
import { getPlatformSettings } from "@/lib/settings";
import { OrderBillView } from "@/components/invoice/OrderBillView";
import { PrintInvoiceButton } from "@/components/invoice/PrintInvoiceButton";
import { AccountShell } from "@/components/account/AccountShell";

export const metadata = { title: "Order Bill" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderBillPage({ params }: Props) {
  const session = await requireAuth();
  const { id } = await params;

  const [order, settings] = await Promise.all([
    prisma.order.findFirst({
      where: { id, clientId: session.user.id },
      include: {
        items: { orderBy: { id: "asc" } },
      },
    }),
    getPlatformSettings(),
  ]);

  if (!order) notFound();

  const bill = buildOrderBill(order, {
    name: settings.businessName,
    address: settings.businessAddress,
    phone: settings.contactPhone,
    email: settings.contactEmail,
    gstin: settings.businessGstin,
    state: settings.businessState,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 print:py-0 print:px-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1 text-sm text-brand-600 font-medium hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>
        <PrintInvoiceButton />
      </div>

      <AccountShell>
        <OrderBillView data={bill} />
      </AccountShell>
    </div>
  );
}
