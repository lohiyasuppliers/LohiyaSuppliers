"use client";

import { Download } from "lucide-react";

interface CsvDownloadButtonProps {
  href: string;
  label: string;
  className?: string;
}

export function CsvDownloadButton({ href, label, className = "" }: CsvDownloadButtonProps) {
  function handleDownload() {
    window.location.assign(href);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className={className || "inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"}
    >
      <Download className="w-4 h-4" />
      {label}
    </button>
  );
}
