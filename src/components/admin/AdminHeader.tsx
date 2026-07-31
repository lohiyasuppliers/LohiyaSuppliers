"use client";

import { AdminSearch } from "@/components/admin/AdminSearch";
import { signOut, useSession } from "next-auth/react";
import { LogOut, ExternalLink, Bell, CheckCheck, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, Suspense } from "react";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Catalog",
  "/admin/categories": "Categories",
  "/admin/orders": "Orders",
  "/admin/users": "Clients",
  "/admin/crm": "CRM",
  "/admin/banners": "Banners",
  "/admin/coupons": "Coupons",
  "/admin/support": "Support",
  "/admin/analytics": "Analytics",
  "/admin/reports": "Reports",
  "/admin/settings": "Settings",
};

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
};

export function AdminHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const pageTitle =
    Object.entries(pageTitles).find(([path]) =>
      path === "/admin" ? pathname === "/admin" : pathname.startsWith(path)
    )?.[1] || "Admin";

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function markRead(id: string) {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function markAllRead() {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    load();
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl md:px-6 animate-slide-up">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden shrink-0 rounded-xl p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block shrink-0 animate-fade-in">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Admin</p>
          <p key={pathname} className="text-sm font-bold text-slate-900 motion-page-admin">
            {pageTitle}
          </p>
        </div>
        <div className="flex-1 max-w-md">
          <Suspense fallback={<div className="h-9 rounded-lg bg-slate-100 animate-pulse" />}>
            <AdminSearch />
          </Suspense>
        </div>
      </div>
      <div className="ml-4 flex items-center gap-2 md:gap-4">
        <div className="relative hidden sm:block" ref={panelRef}>
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              if (!open) load();
            }}
            className="relative rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-500">No notifications</p>
                ) : (
                  items.map((n) => {
                    const content = (
                      <div className={`px-3 py-2.5 hover:bg-slate-50 ${!n.isRead ? "bg-brand-50/40" : ""}`}>
                        <p className="text-sm font-medium text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    );
                    if (n.href) {
                      return (
                        <Link
                          key={n.id}
                          href={n.href}
                          onClick={() => {
                            if (!n.isRead) markRead(n.id);
                            setOpen(false);
                          }}
                          className="block border-b border-slate-50"
                        >
                          {content}
                        </Link>
                      );
                    }
                    return (
                      <button
                        key={n.id}
                        type="button"
                        className="block w-full text-left border-b border-slate-50"
                        onClick={() => {
                          if (!n.isRead) markRead(n.id);
                        }}
                      >
                        {content}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
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
