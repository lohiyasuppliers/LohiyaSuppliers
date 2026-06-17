import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCachedSettings, getCachedCatalogTree } from "@/lib/cache";

const defaultSettings = {
  contactPhone: "+91 98765 43210",
  contactEmail: "info@lohiyasuppliers.com",
  contactAddress: "Industrial Area, Phase II, India",
  gstNumber: "",
  siteName: "Lohiya Suppliers",
  siteTagline: "B2B Industrial Abrasives & Tools",
};

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  let settings = defaultSettings;
  let catalogTree: Awaited<ReturnType<typeof getCachedCatalogTree>> = [];

  try {
    const [platformSettings, tree] = await Promise.all([
      getCachedSettings(),
      getCachedCatalogTree(),
    ]);
    settings = {
      siteName: platformSettings.businessName,
      siteTagline: defaultSettings.siteTagline,
      contactPhone: platformSettings.contactPhone,
      contactEmail: platformSettings.contactEmail,
      contactAddress: defaultSettings.contactAddress,
      gstNumber: platformSettings.businessGstin,
    };
    catalogTree = tree;
  } catch (error) {
    console.error("Failed to load site settings:", error);
  }

  const footerCategories = [
    { href: "/products", label: "All Products" },
    { href: "/products?application=metal", label: "Metal Application" },
    { href: "/products?application=wood", label: "Wood Application" },
    ...catalogTree.flatMap((d) =>
      d.children.slice(0, 2).map((s) => ({
        href: `/categories/${s.slug}`,
        label: s.name,
      }))
    ),
  ];

  return (
    <>
      <Header
        contactPhone={settings.contactPhone}
        contactEmail={settings.contactEmail}
        catalogTree={catalogTree}
      />
      <main className="min-h-screen">{children}</main>
      <Footer
        contactPhone={settings.contactPhone}
        contactEmail={settings.contactEmail}
        contactAddress={settings.contactAddress}
        gstNumber={settings.gstNumber}
        siteName={settings.siteName}
        siteTagline={settings.siteTagline}
        categories={footerCategories}
      />
    </>
  );
}
