"use client";

import { Printer } from "lucide-react";

export function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 print:hidden"
    >
      <Printer className="w-4 h-4" /> Print / Save PDF
    </button>
  );
}
