"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS: Record<string, string> = {
  PAID: "#059669",
  UNPAID: "#dc2626",
  PENDING_VERIFICATION: "#d97706",
  PARTIAL: "#0284c7",
  FAILED: "#6b7280",
  REFUNDED: "#475569",
};

const LABELS: Record<string, string> = {
  PAID: "Paid",
  UNPAID: "Unpaid",
  PENDING_VERIFICATION: "Pending verification",
  PARTIAL: "Partial",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

interface PaymentStatusChartProps {
  data: { status: string; count: number }[];
}

export function PaymentStatusChart({ data }: PaymentStatusChartProps) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: LABELS[d.status] || d.status.replace(/_/g, " "),
      value: d.count,
      status: d.status,
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        No payment status data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={COLORS[entry.status] || "#0c87e8"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [value, name]}
          contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb" }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
