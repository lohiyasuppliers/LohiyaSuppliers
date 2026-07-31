import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BannerActions } from "@/components/admin/BannerActions";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";

export const metadata = { title: "Banners" };
export const revalidate = 0;

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6 admin-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Banners</h1>
          <p className="text-gray-500 text-sm">{banners.length} banners</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvDownloadButton
            href="/api/admin/banners/export"
            label="Download (CSV)"
            className="inline-flex items-center gap-2 px-4 py-2 border border-brand-200 bg-white text-brand-700 rounded-lg text-sm font-medium hover:bg-brand-50"
          />
          <Link
            href="/admin/banners/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" /> Add Banner
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Banner</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {banners.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                  No banners yet. Create one to replace the default homepage hero.
                </td>
              </tr>
            ) : (
              banners.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.imageUrl}
                        alt=""
                        className="h-12 w-20 rounded-lg object-cover border"
                      />
                      <div>
                        <Link
                          href={`/admin/banners/${b.id}/edit`}
                          className="font-medium text-gray-900 hover:text-brand-700"
                        >
                          {b.title}
                        </Link>
                        {b.subtitle && (
                          <p className="text-xs text-gray-500 line-clamp-1">{b.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        b.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/admin/banners/${b.id}/edit`}
                        className="px-2 py-1 text-xs font-medium text-brand-700 hover:underline"
                      >
                        Edit
                      </Link>
                      <BannerActions bannerId={b.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
