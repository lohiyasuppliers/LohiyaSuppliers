"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const RANGES = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
] as const;

export function AnalyticsRangeFilter({ currentDays }: { currentDays: number }) {
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500 mr-1">Range:</span>
      {RANGES.map((r) => {
        const active = currentDays === r.days;
        const params = new URLSearchParams(searchParams.toString());
        params.set("days", String(r.days));
        return (
          <Link
            key={r.days}
            href={`/admin/analytics?${params.toString()}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              active
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
