"use client";

import dynamic from "next/dynamic";

const PaymentStatusChart = dynamic(
  () => import("./PaymentStatusChart").then((m) => ({ default: m.PaymentStatusChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
    ),
  }
);

export function DynamicPaymentStatusChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  return <PaymentStatusChart data={data} />;
}
