"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tags,
  Settings,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Catalog", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Clients", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-gradient-to-b from-brand-950 to-brand-900 text-white flex flex-col transition-all duration-300 shrink-0 shadow-xl",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center gap-3 border-b border-brand-900">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-sm shrink-0">
          LS
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm">Lohiya Suppliers</div>
            <div className="text-xs text-brand-400">B2B Admin</div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-brand-600/80 text-white font-medium shadow-sm"
                  : "text-brand-300 hover:bg-brand-800/60 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 mx-2 mb-2 rounded-lg bg-brand-900/50 border border-brand-800">
          <div className="flex items-center gap-2 text-xs text-brand-300">
            <IndianRupee className="w-3.5 h-3.5" />
            Per-client pricing · GST invoicing
          </div>
        </div>
      )}

      <div className="p-2 border-t border-brand-900">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-brand-400 hover:bg-brand-900 hover:text-white"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {!collapsed && (
          <Link href="/" className="block text-center text-xs text-brand-400 hover:text-white py-2">
            ← Back to Store
          </Link>
        )}
      </div>
    </aside>
  );
}
