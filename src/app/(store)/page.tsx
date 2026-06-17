import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ProductCard } from "@/components/products/ProductCard";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { getCatalogTree, productListSelect } from "@/lib/catalog";
import { CATALOG_IMAGES as IMG } from "@/lib/catalog-images";
import {
  ArrowRight,
  Shield,
  Truck,
  Award,
  CreditCard,
  Wrench,
  TreePine,
  Star,
  Package,
} from "lucide-react";
import { ApplicationType } from "@prisma/client";

export const revalidate = 60;

const features = [
  { icon: Truck, title: "Pan-India B2B Delivery", desc: "Fast fulfillment for prepaid & postpaid orders" },
  { icon: Award, title: "Authorized Brands", desc: "Deerfros, Leitz & AIPL — genuine industrial grade" },
  { icon: Shield, title: "GST Invoices", desc: "CGST/SGST/IGST compliant billing on every order" },
  { icon: CreditCard, title: "Custom Pricing", desc: "Per-client prices, cashback & vouchers" },
];

const brandInfo = [
  {
    name: "Deerfros",
    tagline: "Italian Abrasive Excellence",
    description: "Premium cutting, grinding & sanding solutions for metal and wood industries.",
    color: "from-red-600 to-red-800",
  },
  {
    name: "Leitz",
    tagline: "Precision Tooling",
    description: "World-class carbide cutters, router bits & saw blades for woodworking & metalwork.",
    color: "from-blue-600 to-blue-900",
  },
  {
    name: "AIPL",
    tagline: "Industrial Performance",
    description: "Cost-effective abrasives and tools trusted by fabricators across India.",
    color: "from-amber-500 to-orange-700",
  },
];

export default async function HomePage() {
  const [featured, catalogTree, stats] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: productListSelect,
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    getCatalogTree(),
    Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.productVariation.count({ where: { isActive: true } }),
      prisma.category.count({ where: { parentId: { not: null }, isActive: true } }),
    ]),
  ]);

  const [productCount, variationCount, subcategoryCount] = stats;

  const heroBanners = [
    {
      id: "metal",
      title: "Metal Application Abrasives",
      subtitle: "Cutting wheels, grinding discs, flap discs & carbide cutters for fabrication.",
      image: IMG.metalHero,
      link: "/products?application=metal",
    },
    {
      id: "wood",
      title: "Wood Application Tools",
      subtitle: "Sanding belts, velcro discs, saw blades & edge banding for furniture makers.",
      image: IMG.woodHero,
      link: "/products?application=wood",
    },
    {
      id: "brands",
      title: "Deerfros · Leitz · AIPL",
      subtitle: "Authorized B2B distributor — custom pricing for every registered client.",
      image: IMG.cuttingWheel,
      link: "/products",
    },
  ];

  return (
    <>
      <HeroCarousel banners={heroBanners} />

      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "Products", value: productCount },
              { label: "Variations", value: variationCount },
              { label: "Subcategories", value: subcategoryCount },
              { label: "Brands", value: 3 },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 80}>
                <div className="text-center p-4 rounded-2xl bg-brand-50/50 border border-brand-100">
                  <div className="text-2xl md:text-3xl font-bold text-brand-900">{stat.value}+</div>
                  <div className="text-xs md:text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 60}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 animate-pulse-glow">
                    <f.icon className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{f.title}</div>
                    <div className="text-xs text-gray-500 hidden sm:block">{f.desc}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 gradient-mesh">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal className="text-center mb-12">
            <h2 className="section-heading">Shop by Application</h2>
            <p className="section-subheading">
              Browse our complete abrasives & tools catalog organized for your industry.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {catalogTree.map((dept, i) => (
              <ScrollReveal key={dept.id} delay={i * 100}>
                <Link
                  href={`/categories/${dept.slug}`}
                  className="group relative overflow-hidden rounded-3xl block card-hover"
                >
                  <div className="aspect-[2/1] relative">
                    {dept.imageUrl && (
                      <OptimizedImage
                        src={dept.imageUrl}
                        alt={dept.name}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-900/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                      <div className="flex items-center gap-2 mb-2">
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
                      <p className="text-brand-100 mt-2 text-sm line-clamp-2 max-w-lg">{dept.description}</p>
                      <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold group-hover:gap-2 transition-all">
                        Explore <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal className="text-center mt-8">
            <Link href="/products" className="btn-outline">
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal className="text-center mb-12">
            <h2 className="section-heading">Our Brands</h2>
            <p className="section-subheading">
              Partnering with world-leading manufacturers for abrasives and precision tooling.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {brandInfo.map((brand, i) => (
              <ScrollReveal key={brand.name} delay={i * 80}>
                <div className="rounded-2xl border border-gray-100 overflow-hidden card-hover">
                  <div className={`h-2 bg-gradient-to-r ${brand.color}`} />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Authorized Partner
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{brand.name}</h3>
                    <p className="text-sm text-brand-600 font-medium mt-1">{brand.tagline}</p>
                    <p className="text-sm text-gray-500 mt-3 leading-relaxed">{brand.description}</p>
                    <Link
                      href={`/products?brand=${brand.name}`}
                      className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-brand-700 hover:gap-2 transition-all"
                    >
                      Shop {brand.name} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {catalogTree.map((dept) => (
        <section key={dept.id} className="py-14 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <ScrollReveal className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{dept.name}</h2>
                <p className="text-gray-500 text-sm mt-1">Popular subcategories</p>
              </div>
              <Link
                href={`/categories/${dept.slug}`}
                className="text-brand-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {dept.subcategories.map((sub, i) => (
                <ScrollReveal key={sub.id} delay={i * 40}>
                  <Link
                    href={`/categories/${sub.slug}`}
                    className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all text-center"
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-brand-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Package className="w-6 h-6 text-brand-600" />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 group-hover:text-brand-700 line-clamp-2">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">{sub.productCount} items</p>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal className="flex items-center justify-between mb-8">
            <h2 className="section-heading">Featured Products</h2>
            <Link href="/products" className="inline-flex items-center gap-2 text-brand-600 font-medium">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product, i) => (
              <ScrollReveal key={product.id} delay={i * 50}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-950 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-400 rounded-full blur-3xl animate-float" />
        </div>
        <ScrollReveal className="max-w-3xl mx-auto px-4 relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to order at your custom B2B prices?</h2>
          <p className="text-brand-200 mb-8 text-lg">
            Register as a client to access personalized pricing on {productCount}+ products
            with {variationCount}+ variations from Deerfros, Leitz & AIPL.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex px-8 py-3.5 bg-white text-brand-900 font-semibold rounded-xl hover:bg-brand-50 hover:scale-105 transition-all shadow-lg"
            >
              Register as Client
            </Link>
            <Link
              href="/contact"
              className="inline-flex px-8 py-3.5 border-2 border-white/30 font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Request Bulk Quote
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
