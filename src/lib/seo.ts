import type { Metadata } from "next";

export const SITE_NAME = "Lohiya Suppliers";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://lohiyas.com";

export const DEFAULT_DESCRIPTION =
  "Lohiya Suppliers — B2B industrial abrasives & tools in Jaipur since 2011. Cutting wheels, grinding discs, flap discs for metal & wood industries. Deerfros, Leitz, AIPL brands.";

export const DEFAULT_KEYWORDS = [
  "Lohiya Suppliers",
  "abrasives supplier Jaipur",
  "industrial abrasives India",
  "cutting wheels Jaipur",
  "grinding discs",
  "flap discs",
  "B2B abrasives",
  "metal industry tools",
  "woodworking abrasives",
  "Deerfros",
  "Leitz",
  "AIPL",
  "abrasives Rajasthan",
];

export const BUSINESS = {
  name: SITE_NAME,
  email: "lohiyasuppliers@gmail.com",
  phone: "+917062099524",
  address: {
    street: "145 Ram Nagar Shopping Center, Shastri Nagar",
    city: "Jaipur",
    region: "Rajasthan",
    postalCode: "302016",
    country: "IN",
  },
  foundingDate: "2011",
  geo: { latitude: 26.9124, longitude: 75.7873 },
};

export function absoluteUrl(path = ""): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function truncateDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

export function absoluteImageUrl(url: string | null | undefined): string {
  if (!url?.trim()) return absoluteUrl("/logo.png");
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return absoluteUrl(url.startsWith("/") ? url : `/${url}`);
}

export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image,
  keywords,
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(path);
  const ogImage = absoluteImageUrl(image ?? "/logo.png");

  return {
    title,
    description,
    keywords: keywords ?? DEFAULT_KEYWORDS,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": absoluteUrl("/#organization"),
    name: BUSINESS.name,
    image: absoluteUrl("/logo.png"),
    logo: absoluteUrl("/logo.png"),
    url: SITE_URL,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    foundingDate: BUSINESS.foundingDate,
    description: DEFAULT_DESCRIPTION,
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.street,
      addressLocality: BUSINESS.address.city,
      addressRegion: BUSINESS.address.region,
      postalCode: BUSINESS.address.postalCode,
      addressCountry: BUSINESS.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    },
    areaServed: { "@type": "Country", name: "India" },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: SITE_URL,
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/products?search={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productJsonLd(product: {
  name: string;
  description: string;
  slug: string;
  brand?: string | null;
  images: string[];
  pricePaise: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: truncateDescription(product.description, 5000),
    image: product.images.map((i) => absoluteImageUrl(i)),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    sku: product.slug,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "INR",
      price: (product.pricePaise / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      seller: { "@id": absoluteUrl("/#organization") },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
