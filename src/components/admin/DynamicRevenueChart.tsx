"use client";

import dynamic from "next/dynamic";

const RevenueChart = dynamic(
  () => import("./RevenueChart").then((m) => ({ default: m.RevenueChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
    ),
  }
);

export function DynamicRevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return <RevenueChart data={data} />;
}
