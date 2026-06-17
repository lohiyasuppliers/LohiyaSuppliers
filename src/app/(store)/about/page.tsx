import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Award, Globe, Shield, Package } from "lucide-react";

export const metadata = { title: "About Us" };

export default async function AboutPage() {
  const [productCount, categoryCount, orderCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
  ]);

  return (
    <div>
      <section className="gradient-hero text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">About Lohiya Suppliers</h1>
          <p className="text-brand-100 max-w-2xl mx-auto text-lg">
            Supplying top-grade abrasives to meet the demands of the wooden and metal industries
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Business</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Lohiya Suppliers is a trusted B2B partner for industrial abrasives — serving the metal and woodworking industries
              with cutting wheels, grinding discs, flap discs, sanding products, and expert repair services.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              From the OWJ Grinder Disc to heavy-duty 14-inch cutting wheels, we stock precision tools for every industrial application.
              Our book repair division specializes in bandsaw blade sharpening for bookbinding equipment.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We offer worldwide shipping, secure payments, competitive B2B pricing, and dedicated support for bulk orders.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Package, title: `${productCount}+`, desc: "Active Products" },
              { icon: Award, title: `${categoryCount}`, desc: "Industry Categories" },
              { icon: Globe, title: "Global", desc: "Worldwide Shipping" },
              { icon: Shield, title: `${orderCount}`, desc: "Orders Delivered" },
            ].map((item) => (
              <div key={item.desc} className="bg-white rounded-xl border p-6 text-center">
                <item.icon className="w-8 h-8 text-brand-600 mx-auto mb-3" />
                <div className="font-bold text-2xl text-gray-900">{item.title}</div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Metal Industry", desc: "Cutting wheels, grinding discs, flap discs, and INOX-rated abrasives for metal fabrication.", emoji: "⚙️", href: "/categories/metal-application-products" },
              { title: "Wood Industry", desc: "Sanding belts, polishing discs, and finishing abrasives for woodworking and furniture.", emoji: "🪵", href: "/categories/wood-application-products" },
              { title: "Repair Services", desc: "Expert bandsaw blade repair and sharpening for bookbinding equipment.", emoji: "🔧", href: "/categories/book-repair-services" },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="bg-white rounded-xl p-8 border hover:shadow-md hover:border-brand-200 transition-all">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
