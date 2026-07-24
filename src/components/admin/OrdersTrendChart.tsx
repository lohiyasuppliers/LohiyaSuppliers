"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OrdersTrendChartProps {
  data: { month: string; orders: number }[];
}

export function OrdersTrendChart({ data }: OrdersTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        No order trend data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number) => [value, "Orders"]}
          contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb" }}
        />
        <Line
          type="monotone"
          dataKey="orders"
          stroke="#0154a1"
          strokeWidth={2.5}
          dot={{ fill: "#0c87e8", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
