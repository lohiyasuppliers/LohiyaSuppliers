import { formatPaise, formatDate } from "@/lib/utils";
import { Download, Eye, FileText } from "lucide-react";

interface Bill {
  id: string;
  billNumber: string;
  title: string | null;
  description: string | null;
  amountPaise: number | null;
  billDate: Date;
  fileUrl: string | null;
}

export function ClientBillsList({ bills }: { bills: Bill[] }) {
  if (bills.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
        <FileText className="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p className="text-lg font-medium text-gray-700">No bills yet</p>
        <p className="text-sm mt-2">
          Original bills uploaded by your account manager will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
      {bills.map((bill) => (
        <div
          key={bill.id}
          className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900">{bill.billNumber}</div>
              <div className="text-sm text-gray-500 mt-0.5">
                {bill.title || "Bill"} · {formatDate(bill.billDate)}
              </div>
              {bill.description && (
                <p className="text-sm text-gray-600 mt-1">{bill.description}</p>
              )}
              {bill.amountPaise != null && (
                <p className="text-sm font-bold text-brand-900 mt-2">
                  {formatPaise(bill.amountPaise)}
                </p>
              )}
            </div>
          </div>

          {bill.fileUrl ? (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`/api/user/bills/${bill.id}/file`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-xl hover:bg-brand-100 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View
              </a>
              <a
                href={`/api/user/bills/${bill.id}/file?download=1`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          ) : (
            <span className="text-xs text-gray-400">No file attached</span>
          )}
        </div>
      ))}
    </div>
  );
}
