import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SectionEditor } from "@/components/admin/SectionEditor";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";
import { Globe, Package, Tags, ShoppingCart, Users } from "lucide-react";

export const metadata = { title: "Website Content" };
export const revalidate = 0;

const quickLinks = [
  { href: "/admin/products", label: "Catalog", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Clients", icon: Users },
  { href: "/admin/banners", label: "Banners", icon: Globe },
  { href: "/", label: "View Storefront", icon: Globe },
];

export default async function AdminWebsitePage() {
  const defaults = [
    {
      key: "faq",
      title: "Frequently Asked Questions",
      subtitle: "Common questions about ordering and delivery",
      content: "[]",
      sortOrder: 1,
    },
    {
      key: "testimonials",
      title: "What Our Clients Say",
      subtitle: "Trusted by workshops and manufacturers",
      content: "[]",
      sortOrder: 2,
    },
    {
      key: "why_choose",
      title: "Why Choose Lohiya Suppliers",
      subtitle: "Your authorized B2B partner",
      content: "[]",
      sortOrder: 3,
    },
  ];

  for (const section of defaults) {
    await prisma.pageSection.upsert({
      where: { key: section.key },
      update: {},
      create: section,
    });
  }

  const sections = await prisma.pageSection.findMany({
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });

  return (
    <div className="space-y-6 admin-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-brand-600" />
            Website Content
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Edit homepage sections and jump to catalog, orders, clients, and more.
          </p>
        </div>
        <CsvDownloadButton href="/api/admin/website/export" label="Download Sections (CSV)" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 rounded-xl border bg-white p-3 text-sm font-medium text-gray-700 hover:border-brand-200 hover:bg-brand-50 transition-colors"
          >
            <link.icon className="w-4 h-4 text-brand-600 shrink-0" />
            {link.label}
          </Link>
        ))}
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <SectionEditor key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
