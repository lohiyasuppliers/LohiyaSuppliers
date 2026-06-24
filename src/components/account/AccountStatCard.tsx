import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountStatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  gradient: string;
  href?: string;
  delay?: number;
}

export function AccountStatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  href,
  delay = 0,
}: AccountStatCardProps) {
  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all",
        href && "hover:shadow-md hover:border-brand-200 hover:-translate-y-0.5"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-transform duration-500 group-hover:scale-150",
          gradient
        )}
      />
      <div className="relative">
        <div
          className={cn(
            "mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-105",
            gradient
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-gray-900">{value}</div>
        <div className="mt-0.5 text-sm font-semibold text-gray-700">{label}</div>
        {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block animate-fade-in-up">
        {content}
      </Link>
    );
  }

  return <div className="animate-fade-in-up">{content}</div>;
}
