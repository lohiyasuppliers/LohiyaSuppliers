"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
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
  Image as ImageIcon,
  Globe,
  Gift,
  MessageCircle,
  Contact,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Catalog", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Clients", icon: Users },
  { href: "/admin/crm", label: "CRM", icon: Contact },
  { href: "/admin/support", label: "Support", icon: MessageCircle },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/rewards", label: "Discount & Cashback", icon: Gift },
  { href: "/admin/coupons", label: "Coupons", icon: IndianRupee },
  { href: "/admin/website", label: "Website", icon: Globe },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({
  mobileOpen = false,
  onMobileClose,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex shrink-0 flex-col bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950 text-white shadow-2xl transition-all duration-300",
        "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "w-[72px]" : "w-64 max-w-[85vw]"
      )}
    >
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-brand-400/20 to-transparent" />

      <div className="flex items-center border-b border-white/10 p-3">
        <BrandLogo
          variant={collapsed ? "icon" : "full"}
          href="/admin"
          className={collapsed ? "mx-auto" : "w-full justify-center"}
          imageClassName={collapsed ? undefined : "h-12 sm:h-14 max-w-full"}
        />
      </div>

      <nav className="admin-nav-stagger flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileClose?.()}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 motion-btn-press",
                isActive
                  ? "bg-gradient-to-r from-brand-500/90 to-brand-600/80 font-semibold text-white shadow-lg shadow-brand-900/30 scale-[1.02]"
                  : "text-brand-200 hover:bg-white/10 hover:text-white hover:translate-x-1"
              )}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white" />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mx-2 mb-2 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-brand-200">
            <IndianRupee className="h-3.5 w-3.5 text-brand-400" />
            Per-client pricing · GST invoicing
          </div>
        </div>
      )}

      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-xl p-2 text-brand-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        {!collapsed && (
          <Link
            href="/"
            className="block py-2 text-center text-xs text-brand-400 transition-colors hover:text-white"
          >
            ← Back to Store
          </Link>
        )}
      </div>
    </aside>
  );
}
