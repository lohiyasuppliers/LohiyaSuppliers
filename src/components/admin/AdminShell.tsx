"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PageTransition } from "@/components/motion/PageTransition";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="admin-shell min-h-screen flex bg-gradient-to-br from-slate-100 via-slate-50 to-brand-50/30">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <AdminSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col w-full">
        <AdminHeader onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          <PageTransition variant="admin">{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
