import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Website Content" };

export default function AdminWebsitePage() {
  return (
    <AdminPlaceholder
      title="Website Content"
      description="Homepage sections (FAQ, testimonials, why choose us) can be edited from platform settings and the catalog. Full CMS section editor coming in Module 9."
      links={[
        { href: "/admin/settings", label: "Platform Settings" },
        { href: "/admin/categories", label: "Categories" },
        { href: "/", label: "View Homepage" },
      ]}
    />
  );
}
