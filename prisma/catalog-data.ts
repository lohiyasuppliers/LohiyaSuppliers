/** Curated catalog structure for Lohiya Suppliers — abrasives & tools (Deerfros, Leitz, AIPL). */

export const BRANDS = ["Deerfros", "Leitz", "AIPL"] as const;

export const IMG = {
  cuttingWheel:
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80&auto=format&fit=crop",
  grindingDisc:
    "https://images.unsplash.com/photo-1581092160562-40aa08f7881a?w=800&q=80&auto=format&fit=crop",
  sandingBelt:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop",
  carbideCutter:
    "https://images.unsplash.com/photo-1586864387967-d02f85ddcf50?w=800&q=80&auto=format&fit=crop",
  velcroDisc:
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80&auto=format&fit=crop",
  flapDisc:
    "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&q=80&auto=format&fit=crop",
  wireBrush:
    "https://images.unsplash.com/photo-1581092918056-0c4c3acd3780?w=800&q=80&auto=format&fit=crop",
  sawBlade:
    "https://images.unsplash.com/photo-1606811841689-23e9379fcb6c?w=800&q=80&auto=format&fit=crop",
  routerBit:
    "https://images.unsplash.com/photo-1572981779304-77b8b9a2c2e7?w=800&q=80&auto=format&fit=crop",
  edgeBanding:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop",
  mountedPoint:
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80&auto=format&fit=crop",
  metalHero:
    "https://images.unsplash.com/photo-1565193566174-7a0ee3dbe261?w=1200&q=80&auto=format&fit=crop",
  woodHero:
    "https://images.unsplash.com/photo-1607407023191-3aee7c5b3313?w=1200&q=80&auto=format&fit=crop",
} as const;

export interface CatalogVariation {
  skuSuffix: string;
  attributes: Record<string, string>;
  priceOffsetRupees: number;
}

export interface CatalogProduct {
  name: string;
  slug: string;
  brand: (typeof BRANDS)[number];
  description: string;
  hsnCode: string;
  basePriceRupees: number;
  images: string[];
  variations: CatalogVariation[];
}

export interface CatalogSubcategory {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  products: CatalogProduct[];
}

export interface CatalogDepartment {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  application: "METAL" | "WOOD";
  sortOrder: number;
  subcategories: CatalogSubcategory[];
}

const sizeVariations = (
  prefix: string,
  sizes: string[],
  basePrice: number,
  step = 40
): CatalogVariation[] =>
  sizes.map((size, i) => ({
    skuSuffix: size.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
    attributes: { size },
    priceOffsetRupees: i * step,
  }));

const gritVariations = (
  grits: string[],
  baseStep = 25
): CatalogVariation[] =>
  grits.map((grit, i) => ({
    skuSuffix: grit.replace(/[^a-zA-Z0-9]/g, ""),
    attributes: { grit },
    priceOffsetRupees: i * baseStep,
  }));

export const CATALOG: CatalogDepartment[] = [
  {
    name: "Metal Application Products",
    slug: "metal-application",
    description:
      "High-performance abrasives and precision tools engineered for ferrous and non-ferrous metal fabrication, welding, deburring, and surface finishing.",
    imageUrl: IMG.metalHero,
    application: "METAL",
    sortOrder: 1,
    subcategories: [
      {
        name: "Cutting Wheels",
        slug: "metal-cutting-wheels",
        description:
          "Thin and reinforced cutting discs for stainless steel, mild steel, and alloy cutting on angle grinders.",
        imageUrl: IMG.cuttingWheel,
        sortOrder: 1,
        products: [
          {
            name: "Deerfros INOX Cutting Disc",
            slug: "deerfros-inox-cutting-disc",
            brand: "Deerfros",
            description:
              "Premium stainless steel cutting wheel with low burr formation. Deerfros INOX series uses premium aluminium oxide grain for clean cuts on SS 304/316 without discoloration.",
            hsnCode: "6804",
            basePriceRupees: 85,
            images: [IMG.cuttingWheel],
            variations: sizeVariations("DF-INOX", ["4 inch", "5 inch", "7 inch"], 85),
          },
          {
            name: "AIPL Heavy Duty Metal Cutter",
            slug: "aipl-heavy-duty-metal-cutter",
            brand: "AIPL",
            description:
              "AIPL reinforced cutting wheel for heavy fabrication. High bond strength withstands aggressive cutting on structural steel and MS plates.",
            hsnCode: "6804",
            basePriceRupees: 72,
            images: [IMG.cuttingWheel],
            variations: sizeVariations("AIPL-CUT", ["4 inch", "5 inch", "9 inch"], 72, 35),
          },
          {
            name: "Deerfros Pipeline Cutting Wheel",
            slug: "deerfros-pipeline-cutting-wheel",
            brand: "Deerfros",
            description:
              "Specialized thin wheel for pipeline and tube cutting. Minimal material loss with fast cutting action on carbon steel pipes.",
            hsnCode: "6804",
            basePriceRupees: 95,
            images: [IMG.cuttingWheel],
            variations: sizeVariations("DF-PIPE", ["4 inch", "5 inch"], 95),
          },
        ],
      },
      {
        name: "Grinding Discs",
        slug: "metal-grinding-discs",
        description:
          "Depressed centre grinding wheels for weld grinding, stock removal, and edge preparation on metal surfaces.",
        imageUrl: IMG.grindingDisc,
        sortOrder: 2,
        products: [
          {
            name: "Deerfros A24R Grinding Wheel",
            slug: "deerfros-a24r-grinding-wheel",
            brand: "Deerfros",
            description:
              "General-purpose aluminium oxide grinding disc rated A24R for fast stock removal on mild steel. Excellent wheel life and cool grinding.",
            hsnCode: "6804",
            basePriceRupees: 120,
            images: [IMG.grindingDisc],
            variations: sizeVariations("DF-A24R", ["4 inch", "5 inch", "7 inch"], 120, 45),
          },
          {
            name: "AIPL SS Grinding Disc",
            slug: "aipl-ss-grinding-disc",
            brand: "AIPL",
            description:
              "Stainless steel grinding wheel with iron-free formulation. Prevents contamination on SS welds and leaves a bright finish.",
            hsnCode: "6804",
            basePriceRupees: 145,
            images: [IMG.grindingDisc],
            variations: sizeVariations("AIPL-SSG", ["4 inch", "5 inch"], 145),
          },
          {
            name: "Deerfros Foundry Grinding Wheel",
            slug: "deerfros-foundry-grinding-wheel",
            brand: "Deerfros",
            description:
              "Extra-hard grinding wheel for foundry gate and riser removal. Designed for cast iron and hard alloy grinding.",
            hsnCode: "6804",
            basePriceRupees: 165,
            images: [IMG.grindingDisc],
            variations: sizeVariations("DF-FND", ["7 inch", "9 inch"], 165, 55),
          },
        ],
      },
      {
        name: "Velcro Discs",
        slug: "metal-velcro-discs",
        description:
          "Hook-and-loop sanding discs for random orbital sanders — metal surface prep, paint removal, and finishing.",
        imageUrl: IMG.velcroDisc,
        sortOrder: 3,
        products: [
          {
            name: "Deerfros Zirconia Velcro Disc",
            slug: "deerfros-zirconia-velcro-disc",
            brand: "Deerfros",
            description:
              "Premium zirconia alumina velcro disc for aggressive metal sanding. Long life on stainless and carbon steel.",
            hsnCode: "6805",
            basePriceRupees: 45,
            images: [IMG.velcroDisc],
            variations: [
              ...gritVariations(["40", "60", "80", "120"]),
            ],
          },
          {
            name: "AIPL Ceramic Velcro Disc",
            slug: "aipl-ceramic-velcro-disc",
            brand: "AIPL",
            description:
              "Ceramic grain velcro disc for high-pressure grinding on metal. Self-sharpening grains deliver consistent cut rate.",
            hsnCode: "6805",
            basePriceRupees: 55,
            images: [IMG.velcroDisc],
            variations: gritVariations(["36", "50", "60", "80"], 30),
          },
          {
            name: "Deerfros Surface Prep Velcro Kit",
            slug: "deerfros-surface-prep-velcro-kit",
            brand: "Deerfros",
            description:
              "Multi-grit velcro disc kit for weld blending and pre-paint surface preparation on fabricated metal parts.",
            hsnCode: "6805",
            basePriceRupees: 38,
            images: [IMG.velcroDisc],
            variations: sizeVariations("DF-VKIT", ["5 inch", "6 inch", "7 inch"], 38, 12),
          },
        ],
      },
      {
        name: "Carbide Cutters",
        slug: "metal-carbide-cutters",
        description:
          "Tungsten carbide rotary burrs and cutters for die grinding, deburring, and shaping hardened metals.",
        imageUrl: IMG.carbideCutter,
        sortOrder: 4,
        products: [
          {
            name: "Leitz Double Cut Carbide Burr",
            slug: "leitz-double-cut-carbide-burr",
            brand: "Leitz",
            description:
              "Leitz double-cut tungsten carbide burr for smooth metal removal. Ideal for deburring weld seams and shaping alloy steel.",
            hsnCode: "8207",
            basePriceRupees: 380,
            images: [IMG.carbideCutter],
            variations: [
              { skuSuffix: "6MM", attributes: { shank: "6 mm", head: "Cylindrical" }, priceOffsetRupees: 0 },
              { skuSuffix: "8MM", attributes: { shank: "8 mm", head: "Cylindrical" }, priceOffsetRupees: 80 },
              { skuSuffix: "6BALL", attributes: { shank: "6 mm", head: "Ball nose" }, priceOffsetRupees: 120 },
            ],
          },
          {
            name: "Leitz Tree Radius Carbide Cutter",
            slug: "leitz-tree-radius-carbide-cutter",
            brand: "Leitz",
            description:
              "Tree-radius profile carbide rotary file for contouring and slotting in mould and die work.",
            hsnCode: "8207",
            basePriceRupees: 420,
            images: [IMG.carbideCutter],
            variations: [
              { skuSuffix: "6TR", attributes: { shank: "6 mm", profile: "Tree radius" }, priceOffsetRupees: 0 },
              { skuSuffix: "8TR", attributes: { shank: "8 mm", profile: "Tree radius" }, priceOffsetRupees: 95 },
            ],
          },
          {
            name: "AIPL Carbide Engraving Cutter",
            slug: "aipl-carbide-engraving-cutter",
            brand: "AIPL",
            description:
              "Precision carbide engraving cutter for metal marking and fine detail work on CNC routers and die grinders.",
            hsnCode: "8207",
            basePriceRupees: 290,
            images: [IMG.carbideCutter],
            variations: gritVariations(["0.5mm", "1mm", "2mm", "3mm"], 40),
          },
        ],
      },
      {
        name: "Flap Discs",
        slug: "metal-flap-discs",
        description:
          "Overlapping abrasive flaps for blending, finishing, and contour grinding on metal fabrications.",
        imageUrl: IMG.flapDisc,
        sortOrder: 5,
        products: [
          {
            name: "Deerfros Zirconia Flap Disc",
            slug: "deerfros-zirconia-flap-disc",
            brand: "Deerfros",
            description:
              "Type 27 zirconia flap disc for aggressive grinding and blending. Conformable flaps reach into weld toe areas.",
            hsnCode: "6805",
            basePriceRupees: 95,
            images: [IMG.flapDisc],
            variations: [
              ...sizeVariations("DF-FLAP", ["4 inch", "5 inch", "7 inch"], 95, 30).map((v, i) => ({
                ...v,
                attributes: { ...v.attributes, grit: ["40", "60", "80"][i % 3] },
              })),
            ],
          },
          {
            name: "AIPL Ceramic Flap Disc",
            slug: "aipl-ceramic-flap-disc",
            brand: "AIPL",
            description:
              "Ceramic flap disc for stainless steel and high-alloy finishing. Cool grinding with minimal discoloration.",
            hsnCode: "6805",
            basePriceRupees: 110,
            images: [IMG.flapDisc],
            variations: gritVariations(["40", "60", "80", "120"], 20),
          },
        ],
      },
      {
        name: "Mounted Points",
        slug: "metal-mounted-points",
        description:
          "Small vitrified and resinoid grinding points for internal grinding, deburring, and detail work.",
        imageUrl: IMG.mountedPoint,
        sortOrder: 6,
        products: [
          {
            name: "Deerfros A16 Mounted Point",
            slug: "deerfros-a16-mounted-point",
            brand: "Deerfros",
            description:
              "Pink aluminium oxide mounted point for general metal grinding in tight spaces and bore finishing.",
            hsnCode: "6804",
            basePriceRupees: 35,
            images: [IMG.mountedPoint],
            variations: [
              { skuSuffix: "A16CYL", attributes: { shape: "Cylinder", grit: "A16" }, priceOffsetRupees: 0 },
              { skuSuffix: "A16BAL", attributes: { shape: "Ball", grit: "A16" }, priceOffsetRupees: 8 },
              { skuSuffix: "A16CONE", attributes: { shape: "Cone", grit: "A16" }, priceOffsetRupees: 10 },
            ],
          },
          {
            name: "AIPL W220 Mounted Point Set",
            slug: "aipl-w220-mounted-point-set",
            brand: "AIPL",
            description:
              "White aluminium oxide mounted point assortment for fine finishing and tool sharpening applications.",
            hsnCode: "6804",
            basePriceRupees: 42,
            images: [IMG.mountedPoint],
            variations: gritVariations(["W220", "W320", "W400"], 15),
          },
        ],
      },
      {
        name: "Wire Brushes",
        slug: "metal-wire-brushes",
        description:
          "Crimped and knotted wire brushes for rust removal, weld cleaning, and surface preparation on metal.",
        imageUrl: IMG.wireBrush,
        sortOrder: 7,
        products: [
          {
            name: "Deerfros Knotted Wire Cup Brush",
            slug: "deerfros-knotted-wire-cup-brush",
            brand: "Deerfros",
            description:
              "Heavy-duty knotted wire cup brush for aggressive scale and rust removal on structural steel.",
            hsnCode: "9603",
            basePriceRupees: 185,
            images: [IMG.wireBrush],
            variations: sizeVariations("DF-WIRE", ["3 inch", "4 inch", "5 inch"], 185, 40),
          },
          {
            name: "AIPL Crimped Wire Wheel",
            slug: "aipl-crimped-wire-wheel",
            brand: "AIPL",
            description:
              "Crimped carbon steel wire wheel for light deburring and paint stripping on metal surfaces.",
            hsnCode: "9603",
            basePriceRupees: 145,
            images: [IMG.wireBrush],
            variations: sizeVariations("AIPL-WW", ["4 inch", "5 inch", "6 inch"], 145, 35),
          },
        ],
      },
    ],
  },
  {
    name: "Wood Application Products",
    slug: "wood-application",
    description:
      "Professional abrasives, cutters, and tooling for woodworking, furniture manufacturing, panel processing, and edge banding.",
    imageUrl: IMG.woodHero,
    application: "WOOD",
    sortOrder: 2,
    subcategories: [
      {
        name: "Sanding Belts",
        slug: "wood-sanding-belts",
        description:
          "Cloth and paper sanding belts for wide belt sanders, edge sanders, and portable belt sanders in woodworking shops.",
        imageUrl: IMG.sandingBelt,
        sortOrder: 1,
        products: [
          {
            name: "Deerfros Aluminium Oxide Sanding Belt",
            slug: "deerfros-aluminium-oxide-sanding-belt",
            brand: "Deerfros",
            description:
              "Open-coat aluminium oxide belt for general wood sanding. Excellent grain adhesion for long belt life on solid wood and plywood.",
            hsnCode: "6805",
            basePriceRupees: 220,
            images: [IMG.sandingBelt],
            variations: [
              { skuSuffix: "75x533P80", attributes: { size: "75×533 mm", grit: "80" }, priceOffsetRupees: 0 },
              { skuSuffix: "75x533P120", attributes: { size: "75×533 mm", grit: "120" }, priceOffsetRupees: 15 },
              { skuSuffix: "100x610P80", attributes: { size: "100×610 mm", grit: "80" }, priceOffsetRupees: 35 },
              { skuSuffix: "100x610P120", attributes: { size: "100×610 mm", grit: "120" }, priceOffsetRupees: 50 },
            ],
          },
          {
            name: "AIPL Zirconia Wood Sanding Belt",
            slug: "aipl-zirconia-wood-sanding-belt",
            brand: "AIPL",
            description:
              "Zirconia sanding belt for hardwood and engineered wood. Aggressive cut with consistent finish on oak, teak, and MDF.",
            hsnCode: "6805",
            basePriceRupees: 265,
            images: [IMG.sandingBelt],
            variations: gritVariations(["60", "80", "100", "120"], 35),
          },
          {
            name: "Deerfros Fine Finish Sanding Belt",
            slug: "deerfros-fine-finish-sanding-belt",
            brand: "Deerfros",
            description:
              "Silicon carbide fine grit belt for lacquer sanding and between-coat finishing on furniture panels.",
            hsnCode: "6805",
            basePriceRupees: 195,
            images: [IMG.sandingBelt],
            variations: gritVariations(["180", "220", "320", "400"], 25),
          },
        ],
      },
      {
        name: "Velcro Discs",
        slug: "wood-velcro-discs",
        description:
          "Hook-and-loop discs for orbital sanders — wood stock removal, intermediate sanding, and final finishing.",
        imageUrl: IMG.velcroDisc,
        sortOrder: 2,
        products: [
          {
            name: "Deerfros Wood Velcro Disc",
            slug: "deerfros-wood-velcro-disc",
            brand: "Deerfros",
            description:
              "Premium aluminium oxide velcro disc with anti-clog stearate coating for softwood and hardwood sanding.",
            hsnCode: "6805",
            basePriceRupees: 32,
            images: [IMG.velcroDisc],
            variations: gritVariations(["60", "80", "100", "120", "150"], 8),
          },
          {
            name: "AIPL Film Back Velcro Disc",
            slug: "aipl-film-back-velcro-disc",
            brand: "AIPL",
            description:
              "Film-backed velcro disc for ultra-fine finishing on veneers and lacquered wood surfaces without swirl marks.",
            hsnCode: "6805",
            basePriceRupees: 42,
            images: [IMG.velcroDisc],
            variations: gritVariations(["180", "220", "320", "400"], 10),
          },
          {
            name: "Deerfros Hole-Pattern Velcro Disc",
            slug: "deerfros-hole-pattern-velcro-disc",
            brand: "Deerfros",
            description:
              "8-hole velcro disc compatible with standard random orbital sanders. Uniform dust extraction for cleaner workshops.",
            hsnCode: "6805",
            basePriceRupees: 36,
            images: [IMG.velcroDisc],
            variations: sizeVariations("DF-WVEL", ["5 inch", "6 inch", "8 hole", "6 hole"], 36, 6),
          },
        ],
      },
      {
        name: "Carbide Cutters",
        slug: "wood-carbide-cutters",
        description:
          "CNC router bits and carbide tooling for panel sizing, profiling, and joinery in woodworking.",
        imageUrl: IMG.carbideCutter,
        sortOrder: 3,
        products: [
          {
            name: "Leitz Straight Router Cutter",
            slug: "leitz-straight-router-cutter",
            brand: "Leitz",
            description:
              "Leitz tungsten carbide straight router bit for edge trimming and groove cutting in solid wood and MDF panels.",
            hsnCode: "8208",
            basePriceRupees: 520,
            images: [IMG.carbideCutter],
            variations: [
              { skuSuffix: "6x20", attributes: { diameter: "6 mm", cutLength: "20 mm" }, priceOffsetRupees: 0 },
              { skuSuffix: "8x25", attributes: { diameter: "8 mm", cutLength: "25 mm" }, priceOffsetRupees: 85 },
              { skuSuffix: "12x30", attributes: { diameter: "12 mm", cutLength: "30 mm" }, priceOffsetRupees: 165 },
            ],
          },
          {
            name: "Leitz Compression Router Bit",
            slug: "leitz-compression-router-bit",
            brand: "Leitz",
            description:
              "Up-cut and down-cut compression bit for chip-free routing on laminated boards and melamine panels.",
            hsnCode: "8208",
            basePriceRupees: 780,
            images: [IMG.carbideCutter],
            variations: [
              { skuSuffix: "12COMP", attributes: { diameter: "12 mm", type: "Compression" }, priceOffsetRupees: 0 },
              { skuSuffix: "16COMP", attributes: { diameter: "16 mm", type: "Compression" }, priceOffsetRupees: 220 },
            ],
          },
          {
            name: "AIPL Carbide Flush Trim Bit",
            slug: "aipl-carbide-flush-trim-bit",
            brand: "AIPL",
            description:
              "Flush trim router bit with bearing guide for template routing and laminate edge trimming.",
            hsnCode: "8208",
            basePriceRupees: 445,
            images: [IMG.carbideCutter],
            variations: [
              { skuSuffix: "12FT", attributes: { diameter: "12 mm", bearing: "Top" }, priceOffsetRupees: 0 },
              { skuSuffix: "12FB", attributes: { diameter: "12 mm", bearing: "Bottom" }, priceOffsetRupees: 45 },
            ],
          },
        ],
      },
      {
        name: "Saw Blades",
        slug: "wood-saw-blades",
        description:
          "TCT circular saw blades for rip and cross cutting, panel sizing, and precision woodworking.",
        imageUrl: IMG.sawBlade,
        sortOrder: 4,
        products: [
          {
            name: "Leitz TCT Panel Saw Blade",
            slug: "leitz-tct-panel-saw-blade",
            brand: "Leitz",
            description:
              "Leitz tungsten carbide tipped panel saw blade for clean cuts on MDF, particle board, and plywood.",
            hsnCode: "8202",
            basePriceRupees: 1850,
            images: [IMG.sawBlade],
            variations: [
              { skuSuffix: "30080T", attributes: { diameter: "300 mm", teeth: "80T" }, priceOffsetRupees: 0 },
              { skuSuffix: "35096T", attributes: { diameter: "350 mm", teeth: "96T" }, priceOffsetRupees: 420 },
              { skuSuffix: "400108T", attributes: { diameter: "400 mm", teeth: "108T" }, priceOffsetRupees: 780 },
            ],
          },
          {
            name: "Leitz Rip Saw Blade",
            slug: "leitz-rip-saw-blade",
            brand: "Leitz",
            description:
              "Heavy-duty rip blade with large gullets for fast ripping of solid hardwood along the grain.",
            hsnCode: "8202",
            basePriceRupees: 1650,
            images: [IMG.sawBlade],
            variations: sizeVariations("LZ-RIP", ["250 mm", "300 mm", "350 mm"], 1650, 280),
          },
          {
            name: "AIPL Fine Finish Saw Blade",
            slug: "aipl-fine-finish-saw-blade",
            brand: "AIPL",
            description:
              "High-tooth-count blade for splinter-free cross cuts on veneered panels and laminated boards.",
            hsnCode: "8202",
            basePriceRupees: 1420,
            images: [IMG.sawBlade],
            variations: [
              { skuSuffix: "25496T", attributes: { diameter: "254 mm", teeth: "96T" }, priceOffsetRupees: 0 },
              { skuSuffix: "305108T", attributes: { diameter: "305 mm", teeth: "108T" }, priceOffsetRupees: 310 },
            ],
          },
        ],
      },
      {
        name: "Router Bits",
        slug: "wood-router-bits",
        description:
          "Profile and joinery router bits for decorative edges, dados, rabbets, and CNC cabinetry work.",
        imageUrl: IMG.routerBit,
        sortOrder: 5,
        products: [
          {
            name: "Leitz Roundover Router Bit",
            slug: "leitz-roundover-router-bit",
            brand: "Leitz",
            description:
              "Roundover profile bit for smooth edge rounding on furniture components and solid wood trim.",
            hsnCode: "8208",
            basePriceRupees: 590,
            images: [IMG.routerBit],
            variations: [
              { skuSuffix: "R6", attributes: { radius: "6 mm", shank: "12 mm" }, priceOffsetRupees: 0 },
              { skuSuffix: "R9", attributes: { radius: "9 mm", shank: "12 mm" }, priceOffsetRupees: 75 },
              { skuSuffix: "R12", attributes: { radius: "12 mm", shank: "12 mm" }, priceOffsetRupees: 120 },
            ],
          },
          {
            name: "Leitz Ogee Router Bit",
            slug: "leitz-ogee-router-bit",
            brand: "Leitz",
            description:
              "Classic ogee profile for decorative moulding and period furniture edge detailing.",
            hsnCode: "8208",
            basePriceRupees: 680,
            images: [IMG.routerBit],
            variations: [
              { skuSuffix: "OGS", attributes: { profile: "Small ogee", shank: "12 mm" }, priceOffsetRupees: 0 },
              { skuSuffix: "OGL", attributes: { profile: "Large ogee", shank: "12 mm" }, priceOffsetRupees: 95 },
            ],
          },
          {
            name: "AIPL Slot Cutter Router Bit",
            slug: "aipl-slot-cutter-router-bit",
            brand: "AIPL",
            description:
              "Adjustable slot cutter for biscuit joints, spline grooves, and panel slotting operations.",
            hsnCode: "8208",
            basePriceRupees: 720,
            images: [IMG.routerBit],
            variations: gritVariations(["4mm", "5mm", "6mm", "8mm"], 55),
          },
        ],
      },
      {
        name: "Edge Banding",
        slug: "wood-edge-banding",
        description:
          "Trimming cutters, pre-milling tools, and abrasive accessories for PVC and melamine edge banding lines.",
        imageUrl: IMG.edgeBanding,
        sortOrder: 6,
        products: [
          {
            name: "Leitz Edge Banding Trimmer",
            slug: "leitz-edge-banding-trimmer",
            brand: "Leitz",
            description:
              "Precision carbide edge banding trimming cutter for flush trimming PVC and ABS edges on panel lines.",
            hsnCode: "8208",
            basePriceRupees: 2450,
            images: [IMG.edgeBanding],
            variations: [
              { skuSuffix: "PRE", attributes: { type: "Pre-mill", diameter: "80 mm" }, priceOffsetRupees: 0 },
              { skuSuffix: "FLUSH", attributes: { type: "Flush trim", diameter: "65 mm" }, priceOffsetRupees: 180 },
            ],
          },
          {
            name: "Leitz Radius Edge Scraper",
            slug: "leitz-radius-edge-scraper",
            brand: "Leitz",
            description:
              "Radius scraping tool for soft-form edge banding on curved furniture panels and rounded worktops.",
            hsnCode: "8208",
            basePriceRupees: 1980,
            images: [IMG.edgeBanding],
            variations: [
              { skuSuffix: "R2", attributes: { radius: "R2" }, priceOffsetRupees: 0 },
              { skuSuffix: "R3", attributes: { radius: "R3" }, priceOffsetRupees: 150 },
              { skuSuffix: "R5", attributes: { radius: "R5" }, priceOffsetRupees: 280 },
            ],
          },
          {
            name: "AIPL Edge Banding Buffing Wheel",
            slug: "aipl-edge-banding-buffing-wheel",
            brand: "AIPL",
            description:
              "Non-woven buffing wheel for final polish on edge banded panels. Removes fine scratches after trimming.",
            hsnCode: "6805",
            basePriceRupees: 320,
            images: [IMG.edgeBanding],
            variations: sizeVariations("AIPL-EBW", ["100 mm", "120 mm", "150 mm"], 320, 45),
          },
        ],
      },
    ],
  },
];
