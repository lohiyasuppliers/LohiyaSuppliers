import Link from "next/link";
import { StaticHero } from "@/components/home/StaticHero";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ProductGrid } from "@/components/products/ProductGrid";
import { PricedProductGrid } from "@/components/products/PricedProductGrid";
import { CatalogImage } from "@/components/ui/CatalogImage";
import { getCatalogTree } from "@/lib/catalog";
import {
  getCachedFeaturedProducts,
  getCachedSiteStats,
} from "@/lib/cache";
import { CATALOG_IMAGES as IMG } from "@/lib/catalog-images";
import {
  ArrowRight,
  Shield,
  Truck,
  Award,
  CreditCard,
  Wrench,
  TreePine,
  Package,
  Users,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { ApplicationType } from "@prisma/client";

export const revalidate = 300;
export const dynamic = "force-static";

const features = [
  {
    icon: Truck,
    title: "Pan-India Delivery",
    desc: "Prepaid & postpaid B2B fulfillment across India",
    accent: "from-sky-500 to-brand-600",
  },
  {
    icon: Award,
    title: "Authorized Brands",
    desc: "Genuine Deerfros, Leitz & AIPL products",
    accent: "from-amber-500 to-orange-600",
  },
  {
    icon: Shield,
    title: "Secure Billing",
    desc: "Admin-managed bills & order transparency",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    icon: CreditCard,
    title: "Custom Pricing",
    desc: "Per-client rates, cashback & vouchers",
    accent: "from-violet-500 to-purple-600",
  },
];

const brands = [
  {
    name: "Deerfros",
    tagline: "Italian Abrasive Excellence",
    description: "Premium cutting, grinding & sanding for metal and wood.",
    image: IMG.cuttingWheel,
    href: "/products?brand=Deerfros",
    accent: "border-red-200 hover:border-red-300",
  },
  {
    name: "Leitz",
    tagline: "Precision Tooling",
    description: "Carbide cutters, router bits & saw blades worldwide.",
    image: IMG.carbideCutter,
    href: "/products?brand=Leitz",
    accent: "border-blue-200 hover:border-blue-300",
  },
  {
    name: "AIPL",
    tagline: "Industrial Performance",
    description: "Cost-effective abrasives trusted by fabricators.",
    image: IMG.flapDisc,
    href: "/products?brand=AIPL",
    accent: "border-amber-200 hover:border-amber-300",
  },
];

export default async function HomePage() {
  const [featured, catalogTree, stats] = await Promise.all([
    getCachedFeaturedProducts(),
    getCatalogTree(),
    getCachedSiteStats(),
  ]);

  const { productCount, variationCount, subcategoryCount } = stats;

  const heroBanners = [
    {
      id: "metal",
      title: "Metal Application Abrasives",
      subtitle:
        "Cutting wheels, grinding discs, flap discs & carbide cutters for fabrication shops.",
      image: IMG.metalHero,
      link: "/products?application=metal",
    },
    {
      id: "wood",
      title: "Wood Application Tools",
      subtitle:
        "Sanding belts, velcro discs, saw blades & edge banding for furniture makers.",
      image: IMG.woodHero,
      link: "/products?application=wood",
    },
    {
      id: "brands",
      title: "Deerfros · Leitz · AIPL",
      subtitle: "Authorized B2B distributor with custom pricing for every registered client.",
      image: IMG.brandsHero,
      link: "/products",
    },
  ];

  return (
    <>
      <StaticHero slide={heroBanners[0]} />

      {/* Stats ribbon */}
      <section className="relative z-10 -mt-8 mx-4 max-w-6xl lg:mx-auto">
        <div className="bg-white rounded-3xl shadow-xl shadow-brand-900/10 border border-gray-100 p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Package, label: "Products", value: `${productCount}+` },
              { icon: Layers, label: "Variations", value: `${variationCount}+` },
              { icon: Wrench, label: "Subcategories", value: subcategoryCount },
              { icon: Users, label: "Brands", value: "3" },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 60}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0">
                    <stat.icon className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal className="text-center mb-12">
            <h2 className="section-heading">Why Lohiya Suppliers?</h2>
            <p className="section-subheading">
              Your one-stop B2B partner for industrial abrasives and precision tooling.
            </p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 70}>
                <div className="group h-full p-6 rounded-2xl bg-white border border-gray-100 card-hover">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by application — bento */}
      <section className="py-16 md:py-20 gradient-mesh">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">
                Catalog
              </span>
              <h2 className="section-heading mt-2">Shop by Application</h2>
              <p className="text-gray-600 mt-2 max-w-xl">
                Browse abrasives and tools organized for metal fabrication and woodworking.
              </p>
            </div>
            <Link href="/products" className="btn-primary shrink-0">
              Full Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            {catalogTree.map((dept, i) => (
              <ScrollReveal key={dept.id} delay={i * 100}>
                <Link
                  href={`/categories/${dept.slug}`}
                  className="group relative block overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-sm card-hover min-h-[280px]"
                >
                  <div className="absolute inset-0">
                    <CatalogImage
                      src={dept.imageUrl || IMG.productDefault}
                      alt={dept.name}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-950/95 via-brand-900/60 to-brand-800/20" />
                  </div>
                  <div className="relative p-8 md:p-10 min-h-[280px] flex flex-col justify-end text-white">
                    <div className="flex items-center gap-2 mb-3">
                      {dept.application === ApplicationType.METAL ? (
                        <Wrench className="w-5 h-5 text-brand-300" />
                      ) : (
                        <TreePine className="w-5 h-5 text-brand-300" />
                      )}
                      <span className="text-sm font-medium text-brand-200">
                        {dept.subcategories.length} subcategories
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold">{dept.name}</h3>
                    {dept.description && (
                      <p className="text-brand-100 mt-2 text-sm line-clamp-2 max-w-md">
                        {dept.description}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-2 mt-5 text-sm font-semibold group-hover:gap-3 transition-all">
                      Explore department <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Subcategories — horizontal scroll */}
      {catalogTree.map((dept) => (
        <section key={dept.id} className="py-12 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <ScrollReveal className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{dept.name}</h2>
                <p className="text-gray-500 text-sm mt-1">Popular subcategories</p>
              </div>
              <Link
                href={`/categories/${dept.slug}`}
                className="text-brand-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </ScrollReveal>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              {dept.subcategories.map((sub) => (
                <div key={sub.id} className="snap-start shrink-0 w-[160px] sm:w-[180px]">
                  <Link
                    href={`/categories/${sub.slug}`}
                    className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-brand-200 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-square relative bg-gray-50 overflow-hidden">
                      <CatalogImage
                        src={sub.imageUrl || IMG.productDefault}
                        alt={sub.name}
                        sizes="180px"
                        className="group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-gray-900 group-hover:text-brand-700 line-clamp-2">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">{sub.productCount} items</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Brands */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal className="text-center mb-12">
            <h2 className="section-heading">Our Authorized Brands</h2>
            <p className="section-subheading">
              Partnering with world-leading manufacturers for abrasives and precision tooling.
            </p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {brands.map((brand, i) => (
              <ScrollReveal key={brand.name} delay={i * 80}>
                <Link
                  href={brand.href}
                  className={`group block rounded-2xl border-2 ${brand.accent} overflow-hidden card-hover bg-white`}
                >
                  <div className="aspect-[16/10] relative overflow-hidden bg-gray-50">
                    <CatalogImage
                      src={brand.image}
                      alt={brand.name}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900">{brand.name}</h3>
                    <p className="text-sm text-brand-600 font-medium mt-1">{brand.tagline}</p>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{brand.description}</p>
                    <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-brand-700 group-hover:gap-2 transition-all">
                      Shop {brand.name} <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">
                New arrivals
              </span>
              <h2 className="section-heading mt-2">Featured Products</h2>
            </div>
            <Link href="/products" className="btn-outline">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </ScrollReveal>
          <PricedProductGrid productIds={featured.map((p) => p.id)}>
            <ProductGrid products={featured} />
          </PricedProductGrid>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <CatalogImage
            src={IMG.metalHero}
            alt=""
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-brand-950/90" />
        </div>
        <ScrollReveal className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm mb-6">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            B2B pricing for registered clients
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to order at your custom prices?
          </h2>
          <p className="text-brand-200 mb-8 text-lg leading-relaxed">
            Register as a client to access personalized pricing on {productCount}+ products with{" "}
            {variationCount}+ variations from Deerfros, Leitz & AIPL.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex px-8 py-4 bg-white text-brand-900 font-semibold rounded-2xl hover:bg-brand-50 hover:scale-[1.02] transition-all shadow-lg"
            >
              Register as Client
            </Link>
            <Link
              href="/contact"
              className="inline-flex px-8 py-4 border-2 border-white/30 font-semibold rounded-2xl hover:bg-white/10 transition-colors"
            >
              Request Bulk Quote
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
