import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GlobalPriceSync } from "@/components/cart/GlobalPriceSync";
import { PageTransition } from "@/components/motion/PageTransition";
import { getCachedSettings, getCachedNavCategories } from "@/lib/cache";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/constants";

export const revalidate = 300;

const defaultSettings = {
  contactPhone: DEFAULT_PLATFORM_SETTINGS.contact_phone,
  contactEmail: DEFAULT_PLATFORM_SETTINGS.contact_email,
  contactAddress: DEFAULT_PLATFORM_SETTINGS.business_address,
  gstNumber: DEFAULT_PLATFORM_SETTINGS.business_gstin,
  siteName: DEFAULT_PLATFORM_SETTINGS.business_name,
  siteTagline: "B2B Industrial Abrasives & Tools",
};

type StoreSettings = {
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  gstNumber: string;
  siteName: string;
  siteTagline: string;
};

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  let settings: StoreSettings = { ...defaultSettings };
  let catalogTree: Awaited<ReturnType<typeof getCachedNavCategories>> = [];

  try {
    const [platformSettings, tree] = await Promise.all([
      getCachedSettings(),
      getCachedNavCategories(),
    ]);
    settings = {
      siteName: platformSettings.businessName,
      siteTagline: defaultSettings.siteTagline,
      contactPhone: platformSettings.contactPhone,
      contactEmail: platformSettings.contactEmail,
      contactAddress: platformSettings.businessAddress,
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
      <GlobalPriceSync />
      <Header contactEmail={settings.contactEmail} catalogTree={catalogTree} />
      <main className="min-h-screen">
        <PageTransition variant="store">{children}</PageTransition>
      </main>
      <Footer
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
