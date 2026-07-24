import { prisma } from "@/lib/prisma";
import { BannerForm } from "@/components/admin/BannerForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit Banner" };

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) notFound();

  return (
    <div className="space-y-6 admin-fade-in">
      <div>
        <Link href="/admin/banners" className="text-sm text-brand-600 hover:underline">
          ← Banners
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Banner</h1>
      </div>
      <BannerForm initial={banner} />
    </div>
  );
}
