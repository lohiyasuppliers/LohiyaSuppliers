import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Inquiries" };

export default function AdminInquiriesPage() {
  return (
    <AdminPlaceholder
      title="Contact Inquiries"
      description="Contact form submissions are received via the API. An inquiries inbox will be added in the next admin update. Use the contact page to test form submissions."
      links={[
        { href: "/contact", label: "Contact Page" },
        { href: "/admin/users", label: "Client Accounts" },
      ]}
    />
  );
}
