import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Banners" };

export default function AdminBannersPage() {
  return (
    <AdminPlaceholder
      title="Homepage Banners"
      description="Banner carousel management will be available in the next module. For now, the storefront uses the default hero carousel with metal, wood, and brand slides from the catalog seed."
      links={[
        { href: "/", label: "View Storefront" },
        { href: "/admin/products", label: "Manage Catalog" },
      ]}
    />
  );
}
