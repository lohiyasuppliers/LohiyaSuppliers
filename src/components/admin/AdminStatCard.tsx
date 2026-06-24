import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  gradient: string;
  badge: string;
  badgeTone?: "success" | "warning" | "neutral";
  delay?: number;
}

const badgeStyles = {
  success: "text-emerald-700 bg-emerald-50 border-emerald-100",
  warning: "text-amber-700 bg-amber-50 border-amber-100",
  neutral: "text-slate-600 bg-slate-50 border-slate-100",
};

export function AdminStatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  badge,
  badgeTone = "neutral",
  delay = 0,
}: AdminStatCardProps) {
  return (
    <div
      className="admin-card group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-5 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-transform duration-500 group-hover:scale-150",
          gradient
        )}
      />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
              gradient
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium",
              badgeStyles[badgeTone]
            )}
          >
            {badge}
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        <div className="mt-0.5 text-sm font-semibold text-slate-700">{label}</div>
        <div className="mt-1 text-xs text-slate-500">{sub}</div>
      </div>
    </div>
  );
}
