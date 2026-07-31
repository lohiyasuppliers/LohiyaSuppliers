"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FileText,
  Building2,
  ShoppingBag,
  Gift,
  MessageCircle,
  Menu,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/bills", label: "Bills", icon: FileText },
  { href: "/account/cashback", label: "Cashback", icon: Gift },
  { href: "/account/support", label: "Support", icon: MessageCircle },
  { href: "/account/profile", label: "Profile", icon: Building2 },
  { href: "/products", label: "Catalog", icon: ShoppingBag },
];

export function AccountMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm"
      >
        <span className="flex items-center gap-2">
          <Menu className="w-4 h-4 text-brand-600" />
          Account menu
        </span>
        <span className="text-xs text-gray-500">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <nav className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={`tab-${item.href}`}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                active
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
