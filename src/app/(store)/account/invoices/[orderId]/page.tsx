import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { formatPaise, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function AccountInvoiceDetailPage({ params }: Props) {
  const session = await requireAuth();
  const { orderId } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { orderId, order: { clientId: session.user.id } },
    include: { order: { select: { orderNumber: true } } },
  });

  if (!invoice) {
    redirect("/account/invoices");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/account/invoices"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Invoices
      </Link>

      <div className="bg-white rounded-xl border p-8">
        <h1 className="text-2xl font-bold text-gray-900">GST Invoice</h1>
        <p className="text-gray-500 mt-1">{invoice.invoiceNumber}</p>

        <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
          <div>
            <span className="text-gray-500">Order:</span> {invoice.order.orderNumber}
          </div>
          <div>
            <span className="text-gray-500">Date:</span> {formatDate(invoice.createdAt)}
          </div>
          <div>
            <span className="text-gray-500">Taxable:</span> {formatPaise(invoice.taxablePaise)}
          </div>
          <div>
            <span className="text-gray-500">Total:</span>{" "}
            <strong>{formatPaise(invoice.totalPaise)}</strong>
          </div>
          {invoice.cgstPaise > 0 && (
            <div>
              <span className="text-gray-500">CGST + SGST:</span>{" "}
              {formatPaise(invoice.cgstPaise + invoice.sgstPaise)}
            </div>
          )}
          {invoice.igstPaise > 0 && (
            <div>
              <span className="text-gray-500">IGST:</span> {formatPaise(invoice.igstPaise)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
