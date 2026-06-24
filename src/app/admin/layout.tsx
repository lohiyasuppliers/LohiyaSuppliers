import { requireAdmin } from "@/lib/session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PageTransition } from "@/components/motion/PageTransition";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="admin-shell min-h-screen flex bg-gradient-to-br from-slate-100 via-slate-50 to-brand-50/30">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <PageTransition variant="admin">{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
