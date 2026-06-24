import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Coupons & Vouchers" };

export default function AdminCouponsPage() {
  return (
    <AdminPlaceholder
      title="Client Vouchers"
      description="Per-client voucher management is defined in the database schema and will be wired in Module 8. Client-specific pricing and orders are already active."
      links={[
        { href: "/admin/users", label: "Manage Clients" },
        { href: "/admin/orders", label: "View Orders" },
      ]}
    />
  );
}
