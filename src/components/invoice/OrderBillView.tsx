import type { OrderBillData } from "@/lib/order-bill";
import { formatPaise } from "@/lib/utils";

export function OrderBillView({ data }: { data: OrderBillData }) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border print:rounded-none"
      id="order-bill"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-950 via-brand-800 to-brand-700 text-white px-6 md:px-10 py-8">
        <div className="flex flex-wrap justify-between gap-6">
          <div>
            <p className="text-brand-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Tax Invoice / Bill
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">{data.seller.name}</h1>
            <p className="text-brand-100 text-sm mt-2 max-w-md">{data.seller.address}</p>
            <p className="text-brand-200 text-sm mt-1">
              {data.seller.phone} · {data.seller.email}
            </p>
            {data.seller.gstin && (
              <p className="text-brand-200 text-sm font-mono mt-1">GSTIN: {data.seller.gstin}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-brand-200 text-xs uppercase tracking-wider">Bill No.</p>
            <p className="font-mono font-bold text-xl md:text-2xl">{data.billNumber}</p>
            <p className="text-brand-200 text-sm mt-3">Order: {data.orderNumber}</p>
            <p className="text-brand-100 text-sm">{data.orderDate} · {data.orderTime}</p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-10 space-y-8">
        {/* Parties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Bill To
            </h3>
            <p className="font-bold text-gray-900 text-lg">{data.buyer.company}</p>
            <p className="text-sm text-gray-700 mt-1">{data.buyer.name}</p>
            <div className="text-sm text-gray-600 mt-3 space-y-1">
              <p>{data.buyer.address}</p>
              <p>
                {data.buyer.city}, {data.buyer.state} — {data.buyer.pincode}
              </p>
              <p>{data.buyer.country}</p>
              <p className="pt-2">
                <span className="text-gray-500">Phone:</span> {data.buyer.phone}
              </p>
              <p>
                <span className="text-gray-500">Email:</span> {data.buyer.email}
              </p>
              <p>
                <span className="text-gray-500">GSTIN:</span>{" "}
                <span className="font-mono">{data.buyer.gstin}</span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Order Details
            </h3>
            <dl className="text-sm space-y-2">
              {[
                ["Order Status", data.orderStatus],
                ["Payment Status", data.paymentStatus],
                ["Order Type", data.orderType],
                ["Place of Supply", data.buyer.state],
                ["Generated On", data.generatedAt],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900 text-right">{value}</dd>
                </div>
              ))}
            </dl>
            {data.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Order Notes</p>
                <p className="text-sm text-gray-700">{data.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-brand-50 border-b border-brand-100">
                <th className="text-left py-3 px-3 font-semibold text-gray-700">#</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Description</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">HSN</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">GST %</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Qty</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Rate</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Taxable</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Tax</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((item) => (
                <tr key={item.index} className="hover:bg-gray-50/50">
                  <td className="py-3 px-3 text-gray-500">{item.index}</td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    {item.variationLabel && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.variationLabel}</p>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-gray-600">{item.hsnCode}</td>
                  <td className="py-3 px-3 text-right text-gray-600">{item.gstRatePercent}%</td>
                  <td className="py-3 px-3 text-right">{item.quantity}</td>
                  <td className="py-3 px-3 text-right">{formatPaise(item.unitPricePaise)}</td>
                  <td className="py-3 px-3 text-right">{formatPaise(item.taxablePaise)}</td>
                  <td className="py-3 px-3 text-right text-gray-600">
                    {formatPaise(item.taxPaise)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium">
                    {formatPaise(item.lineTotalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col md:flex-row md:justify-between gap-6">
          <div className="text-sm text-gray-600 max-w-md">
            <p className="font-semibold text-gray-800 mb-2">Amount in words</p>
            <p className="italic text-gray-500">
              {formatPaise(data.totalPaise)} (Indian Rupees) inclusive of applicable GST.
            </p>
          </div>
          <div className="w-full md:w-80 space-y-2 text-sm shrink-0">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal (excl. GST)</span>
              <span>{formatPaise(data.subtotalPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GST</span>
              <span>{formatPaise(data.taxPaise)}</span>
            </div>
            {data.discountPaise > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span>-{formatPaise(data.discountPaise)}</span>
              </div>
            )}
            {data.voucherDiscountPaise > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Voucher Discount</span>
                <span>-{formatPaise(data.voucherDiscountPaise)}</span>
              </div>
            )}
            {data.cashbackAppliedPaise > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Cashback Applied</span>
                <span>-{formatPaise(data.cashbackAppliedPaise)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3 text-brand-900">
              <span>Grand Total</span>
              <span>{formatPaise(data.totalPaise)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Amount Paid</span>
              <span>{formatPaise(data.paidPaise)}</span>
            </div>
            {data.balancePaise > 0 && (
              <div className="flex justify-between text-amber-700 font-semibold">
                <span>Balance Due</span>
                <span>{formatPaise(data.balancePaise)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className="border-t-2 border-dashed border-gray-200 pt-6 mt-4">
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-5 py-4 text-center">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              This is a system generated Bill
            </p>
            <p className="text-xs text-gray-500 mt-2 max-w-2xl mx-auto leading-relaxed">
              This document is computer-generated and does not require a physical signature. It is
              issued for your records based on order data in the Lohiya Suppliers B2B portal. For
              official tax invoices or discrepancies, please contact your account manager.
            </p>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            {data.seller.name} · {data.seller.state} · Generated {data.generatedAt}
          </p>
        </div>
      </div>
    </div>
  );
}
