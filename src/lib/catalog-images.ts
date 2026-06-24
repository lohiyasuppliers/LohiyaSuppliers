/**
 * Single source of truth for storefront & seed images.
 * Local SVGs in /public/images — always load reliably (no broken Unsplash links).
 */
const base = "/images";

export const CATALOG_IMAGES = {
  cuttingWheel: `${base}/categories/cutting-wheel.svg`,
  grindingDisc: `${base}/categories/grinding-disc.svg`,
  sandingBelt: `${base}/categories/sanding-belt.svg`,
  carbideCutter: `${base}/categories/carbide-cutter.svg`,
  velcroDisc: `${base}/categories/velcro-disc.svg`,
  flapDisc: `${base}/categories/flap-disc.svg`,
  wireBrush: `${base}/categories/wire-brush.svg`,
  sawBlade: `${base}/categories/saw-blade.svg`,
  routerBit: `${base}/categories/router-bit.svg`,
  edgeBanding: `${base}/categories/edge-banding.svg`,
  mountedPoint: `${base}/categories/mounted-point.svg`,
  metalHero: `${base}/heroes/metal-hero.svg`,
  woodHero: `${base}/heroes/wood-hero.svg`,
  brandsHero: `${base}/heroes/brands-hero.svg`,
  productDefault: `${base}/product-default.svg`,
  teamAnil: `${base}/team/anil-lohiya.png`,
  teamSunil: `${base}/team/sunil-lohiya.png`,
  teamShivam: `${base}/team/shivam-lohiya.png`,
  teamIshant: `${base}/team/ishant-goyal.png`,
  aboutHero: `${base}/about/hero-industrial.jpg`,
  aboutWorkshop: `${base}/about/workshop-grinding.jpg`,
  aboutWarehouse: `${base}/about/warehouse.jpg`,
  aboutMetal: `${base}/about/metal-sparks.jpg`,
  aboutWood: `${base}/about/wood-craft.jpg`,
  aboutRepair: `${base}/about/tools-repair.jpg`,
  aboutFactory: `${base}/about/factory-floor.jpg`,
} as const;

/** Map category slug → image for DB refresh & fallbacks. */
export const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  "metal-application": CATALOG_IMAGES.metalHero,
  "wood-application": CATALOG_IMAGES.woodHero,
  "cutting-wheels": CATALOG_IMAGES.cuttingWheel,
  "grinding-discs": CATALOG_IMAGES.grindingDisc,
  "velcro-discs": CATALOG_IMAGES.velcroDisc,
  "carbide-cutters-metal": CATALOG_IMAGES.carbideCutter,
  "flap-discs": CATALOG_IMAGES.flapDisc,
  "mounted-points": CATALOG_IMAGES.mountedPoint,
  "wire-brushes": CATALOG_IMAGES.wireBrush,
  "sanding-belts": CATALOG_IMAGES.sandingBelt,
  "velcro-discs-wood": CATALOG_IMAGES.velcroDisc,
  "carbide-cutters-wood": CATALOG_IMAGES.carbideCutter,
  "saw-blades": CATALOG_IMAGES.sawBlade,
  "router-bits": CATALOG_IMAGES.routerBit,
  "edge-banding": CATALOG_IMAGES.edgeBanding,
};

export function categoryImageForSlug(slug: string): string {
  return CATEGORY_IMAGE_BY_SLUG[slug] ?? CATALOG_IMAGES.productDefault;
}

/** Parse product images JSON and return first valid src. */
export function firstProductImage(imagesJson: string | null | undefined): string {
  if (!imagesJson?.trim()) return CATALOG_IMAGES.productDefault;
  try {
    const arr = JSON.parse(imagesJson) as string[];
    const valid = arr.find((u) => u?.trim());
    return valid ? normalizeImageUrl(valid) : CATALOG_IMAGES.productDefault;
  } catch {
    return CATALOG_IMAGES.productDefault;
  }
}

/** All product images normalized, with default fallback. */
export function productImagesFromJson(imagesJson: string | null | undefined): string[] {
  if (!imagesJson?.trim()) return [CATALOG_IMAGES.productDefault];
  try {
    const arr = JSON.parse(imagesJson) as string[];
    const normalized = arr.filter((u) => u?.trim()).map((u) => normalizeImageUrl(u));
    return normalized.length ? normalized : [CATALOG_IMAGES.productDefault];
  } catch {
    return [CATALOG_IMAGES.productDefault];
  }
}

/** Upgrade legacy broken Unsplash URLs to local assets. */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url?.trim()) return CATALOG_IMAGES.productDefault;
  if (url.startsWith("/")) return url;
  if (url.includes("unsplash.com")) {
    if (url.includes("1504148455328") || url.includes("cutting")) return CATALOG_IMAGES.cuttingWheel;
    if (url.includes("1581092160562") || url.includes("grinding")) return CATALOG_IMAGES.grindingDisc;
    if (url.includes("1558618666") || url.includes("sanding") || url.includes("wood")) return CATALOG_IMAGES.sandingBelt;
    if (url.includes("1586864387967") || url.includes("carbide")) return CATALOG_IMAGES.carbideCutter;
    if (url.includes("1621905252507") || url.includes("velcro")) return CATALOG_IMAGES.velcroDisc;
    if (url.includes("1530124566582") || url.includes("flap")) return CATALOG_IMAGES.flapDisc;
    if (url.includes("1581092918056") || url.includes("wire")) return CATALOG_IMAGES.wireBrush;
    if (url.includes("1606811841689") || url.includes("saw")) return CATALOG_IMAGES.sawBlade;
    if (url.includes("1572981779304") || url.includes("router")) return CATALOG_IMAGES.routerBit;
    if (url.includes("1504328345606") || url.includes("mounted")) return CATALOG_IMAGES.mountedPoint;
    if (url.includes("1565193566174")) return CATALOG_IMAGES.metalHero;
    return CATALOG_IMAGES.productDefault;
  }
  return url;
}
