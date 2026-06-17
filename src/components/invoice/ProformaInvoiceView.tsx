import type { ProformaInvoiceData } from "@/lib/invoice";
import { formatPrice } from "@/lib/utils";

export function ProformaInvoiceView({ data }: { data: ProformaInvoiceData }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden print:shadow-none print:border-0" id="proforma-invoice">
      <div className="gradient-hero text-white px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">PROFORMA INVOICE</h1>
            <p className="text-brand-200 text-sm mt-1">{data.seller.name}</p>
          </div>
          <div className="text-right text-sm">
            <div className="font-mono font-bold text-lg">{data.invoiceNumber}</div>
            <div className="text-brand-200 mt-1">Order: {data.orderNumber}</div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
            <div className="text-sm space-y-1">
              <p className="font-bold text-gray-900 text-base">{data.customer.company}</p>
              <p><span className="text-gray-500">Company ID:</span> {data.customer.companyId}</p>
              <p><span className="text-gray-500">Contact:</span> {data.customer.name}</p>
              <p><span className="text-gray-500">Phone:</span> {data.customer.phone}</p>
              <p><span className="text-gray-500">Email:</span> {data.customer.email}</p>
              <p><span className="text-gray-500">GSTIN:</span> {data.customer.gstNumber}</p>
              <p className="mt-2">{data.customer.address}</p>
              <p>{data.customer.city}, {data.customer.state} - {data.customer.pincode}</p>
              <p>{data.customer.country}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Seller</h3>
            <div className="text-sm space-y-1">
              <p className="font-bold text-gray-900">{data.seller.name}</p>
              <p>{data.seller.address}</p>
              <p><span className="text-gray-500">Phone:</span> {data.seller.phone}</p>
              <p><span className="text-gray-500">Email:</span> {data.seller.email}</p>
              <p><span className="text-gray-500">GSTIN:</span> {data.seller.gstNumber}</p>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
              <p><span className="text-gray-500">Order Date:</span> <strong>{data.orderDate}</strong></p>
              <p><span className="text-gray-500">Order Time:</span> <strong>{data.orderTime}</strong></p>
              <p><span className="text-gray-500">Payment:</span> {data.paymentMethod} ({data.paymentStatus})</p>
              <p><span className="text-gray-500">Generated:</span> {data.generatedAt}</p>
            </div>
          </div>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-brand-50 border-y border-brand-100">
              <th className="text-left py-3 px-3 font-semibold text-gray-700">#</th>
              <th className="text-left py-3 px-3 font-semibold text-gray-700">Product</th>
              <th className="text-left py-3 px-3 font-semibold text-gray-700">SKU</th>
              <th className="text-right py-3 px-3 font-semibold text-gray-700">Qty</th>
              <th className="text-right py-3 px-3 font-semibold text-gray-700">Unit Price</th>
              <th className="text-right py-3 px-3 font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.items.map((item, i) => (
              <tr key={i}>
                <td className="py-3 px-3 text-gray-500">{i + 1}</td>
                <td className="py-3 px-3 font-medium">{item.name}</td>
                <td className="py-3 px-3 font-mono text-xs text-gray-500">{item.sku}</td>
                <td className="py-3 px-3 text-right">{item.quantity}</td>
                <td className="py-3 px-3 text-right">{formatPrice(item.unitPrice)}</td>
                <td className="py-3 px-3 text-right font-medium">{formatPrice(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(data.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{formatPrice(data.shipping)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax (GST)</span><span>{formatPrice(data.tax)}</span></div>
            {data.discount > 0 && (
              <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(data.discount)}</span></div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2 text-brand-900">
              <span>Grand Total</span><span>{formatPrice(data.total)}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center border-t pt-4">
          This is a computer-generated proforma invoice. Valid after admin verification.
        </p>
      </div>
    </div>
  );
}
