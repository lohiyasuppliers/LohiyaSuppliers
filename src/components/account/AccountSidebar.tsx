"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  FileText,
  Building2,
  ShoppingBag,
  Wallet,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/bills", label: "My Bills", icon: FileText },
  { href: "/account/cashback", label: "Cashback Wallet", icon: Gift },
  { href: "/account/profile", label: "Company Profile", icon: Building2 },
  { href: "/products", label: "Browse Catalog", icon: ShoppingBag },
];

function initials(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }
  return (email?.[0] ?? "C").toUpperCase();
}

export function AccountSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const name = session?.user?.name;
  const email = session?.user?.email;
  const company = session?.user?.company;

  return (
    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-fit lg:sticky lg:top-24 motion-card-lift">
      <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-gray-100">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white shadow-md">
          {initials(name, email)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate text-sm">{name || "Client"}</p>
          <p className="text-xs text-gray-500 truncate">{company || email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 py-2 mb-1 text-xs font-semibold text-brand-600 uppercase tracking-wide">
        <Wallet className="w-3.5 h-3.5" /> Client Portal
      </div>

      <nav className="space-y-1 motion-stagger-group" style={{ "--stagger-step": "40ms" } as React.CSSProperties}>
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 motion-btn-press",
                active
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/25 scale-[1.02]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-0.5"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
