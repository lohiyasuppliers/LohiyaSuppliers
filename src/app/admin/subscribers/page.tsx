import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Subscribers" };

export default function AdminSubscribersPage() {
  return (
    <AdminPlaceholder
      title="Newsletter Subscribers"
      description="Email subscriber list and export will be enabled when the marketing module is connected. The subscribe API endpoint is already in place."
      links={[{ href: "/contact", label: "Contact Page" }]}
    />
  );
}
