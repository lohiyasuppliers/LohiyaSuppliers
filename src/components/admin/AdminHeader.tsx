"use client";

import { AdminSearch } from "@/components/admin/AdminSearch";
import { signOut, useSession } from "next-auth/react";
import { LogOut, ExternalLink, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Catalog",
  "/admin/categories": "Categories",
  "/admin/orders": "Orders",
  "/admin/users": "Clients",
  "/admin/analytics": "Analytics",
  "/admin/reports": "Reports",
  "/admin/settings": "Settings",
};

export function AdminHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const pageTitle =
    Object.entries(pageTitles).find(([path]) =>
      path === "/admin" ? pathname === "/admin" : pathname.startsWith(path)
    )?.[1] || "Admin";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl md:px-6 animate-slide-up">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="hidden sm:block shrink-0 animate-fade-in">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Admin</p>
          <p key={pathname} className="text-sm font-bold text-slate-900 motion-page-admin">
            {pageTitle}
          </p>
        </div>
        <div className="flex-1 max-w-md">
          <AdminSearch />
        </div>
      </div>
      <div className="ml-4 flex items-center gap-2 md:gap-4">
        <button
          type="button"
          className="hidden rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 sm:block"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <Link
          href="/"
          target="_blank"
          className="hidden items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
        >
          View Store <ExternalLink className="h-3 w-3" />
        </Link>
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3 md:pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white shadow-md">
            {session?.user?.name?.[0] || "A"}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-slate-900">{session?.user?.name}</div>
            <div className="text-xs font-medium text-brand-600">Administrator</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
