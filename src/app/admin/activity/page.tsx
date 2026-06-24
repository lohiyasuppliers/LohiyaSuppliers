import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Activity Log" };

export default function AdminActivityPage() {
  return (
    <AdminPlaceholder
      title="Activity Log"
      description="Admin activity tracking is prepared in the codebase and will display order approvals, catalog changes, and client updates in a future release."
      links={[{ href: "/admin/orders", label: "Recent Orders" }]}
    />
  );
}
