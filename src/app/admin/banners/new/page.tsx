import { BannerForm } from "@/components/admin/BannerForm";
import Link from "next/link";

export const metadata = { title: "New Banner" };

export default function NewBannerPage() {
  return (
    <div className="space-y-6 admin-fade-in">
      <div>
        <Link href="/admin/banners" className="text-sm text-brand-600 hover:underline">
          ← Banners
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Banner</h1>
      </div>
      <BannerForm />
    </div>
  );
}
