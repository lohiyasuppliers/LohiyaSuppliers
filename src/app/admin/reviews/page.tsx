import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Reviews" };

export default function AdminReviewsPage() {
  return (
    <AdminPlaceholder
      title="Product Reviews"
      description="Customer review moderation will be added in a future storefront update. All catalog, orders, and client management features are fully operational."
      links={[{ href: "/admin/products", label: "Manage Products" }]}
    />
  );
}
