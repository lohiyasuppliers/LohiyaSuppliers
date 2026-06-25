"use client";

import { useInView } from "@/hooks/useInView";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import { Award, Package, Shield, Truck, FileText, Wrench, LayoutGrid, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Truck, title: "Worldwide Shipping", desc: "Pan-India and international delivery for bulk B2B orders." },
  { icon: Award, title: "Best Quality", desc: "Authorized Deerfros, Leitz & AIPL — genuine industrial grade." },
  { icon: Shield, title: "Secure Payments", desc: "Prepaid and postpaid options with trusted payment processing." },
  { icon: Package, title: "Best Offers", desc: "Custom B2B pricing, cashback rewards, and volume discounts." },
  { icon: Wrench, title: "Repair Services", desc: "Bandsaw blade repair and sharpening for bookbinding equipment." },
  { icon: FileText, title: "GST Invoicing", desc: "Compliant bills and proforma invoices for registered businesses." },
  { icon: LayoutGrid, title: "Live Catalog", desc: "Real-time pricing, variations, and stock-ready product pages." },
  { icon: UserCircle, title: "Account Portal", desc: "Order history, bills, wallet, and profile in one dashboard." },
];

export function AboutFeatures() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-24 relative overflow-hidden bg-white">
      <div className="absolute inset-0 gradient-mesh opacity-60" />

      <div className="relative max-w-7xl mx-auto px-4">
        <AboutSectionHeader
          eyebrow="Why choose us"
          title={
            <>
              Built for{" "}
              <span className="text-gradient">B2B excellence</span>
            </>
          }
          subtitle="Everything your industrial operation needs — quality products, reliable logistics, and trusted payments."
          inView={inView}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={cn(
                "group relative p-7 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 overflow-hidden",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/0 to-brand-600/0 group-hover:from-brand-600/[0.03] group-hover:to-brand-600/[0.06] transition-all duration-500" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-brand-600/20">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{f.title}</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
