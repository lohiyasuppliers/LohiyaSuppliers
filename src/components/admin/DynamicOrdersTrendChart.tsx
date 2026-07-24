"use client";

import dynamic from "next/dynamic";

const OrdersTrendChart = dynamic(
  () => import("./OrdersTrendChart").then((m) => ({ default: m.OrdersTrendChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
    ),
  }
);

export function DynamicOrdersTrendChart({
  data,
}: {
  data: { month: string; orders: number }[];
}) {
  return <OrdersTrendChart data={data} />;
}
