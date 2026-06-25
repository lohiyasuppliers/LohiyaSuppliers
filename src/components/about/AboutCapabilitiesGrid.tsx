"use client";

import { useInView } from "@/hooks/useInView";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Boxes,
  Clock,
  Headphones,
  Layers,
  MapPin,
  RefreshCw,
  Wallet,
  Zap,
} from "lucide-react";

const CAPABILITIES = [
  {
    icon: BadgeCheck,
    title: "Authorized Brands",
    desc: "Genuine Deerfros, Leitz & AIPL — no grey-market risk.",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    icon: Wallet,
    title: "B2B Custom Pricing",
    desc: "Negotiated rates, volume discounts, and client-specific price lists.",
    accent: "from-brand-500 to-brand-700",
  },
  {
    icon: RefreshCw,
    title: "Cashback Rewards",
    desc: "Earn and redeem wallet credits on repeat bulk orders.",
    accent: "from-violet-500 to-purple-700",
  },
  {
    icon: Layers,
    title: "SKU Variations",
    desc: "Sizes, grits, and specs — pick the exact variant for your line.",
    accent: "from-orange-500 to-amber-600",
  },
  {
    icon: MapPin,
    title: "Pan-India Dispatch",
    desc: "Reliable logistics from Jaipur to fabrication shops nationwide.",
    accent: "from-sky-500 to-blue-700",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    desc: "Streamlined order approval and fulfilment for B2B buyers.",
    accent: "from-rose-500 to-pink-600",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    desc: "Reach our team for quotes, repairs, and technical guidance.",
    accent: "from-indigo-500 to-indigo-700",
  },
  {
    icon: Boxes,
    title: "Bulk & Repeat Orders",
    desc: "Postpaid accounts, GST invoices, and order history in one portal.",
    accent: "from-cyan-500 to-teal-600",
  },
  {
    icon: Zap,
    title: "Digital Platform",
    desc: "Modern catalog, live pricing, and secure checkout — built for industry.",
    accent: "from-amber-500 to-orange-600",
  },
];

export function AboutCapabilitiesGrid() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="relative py-24 overflow-hidden bg-gray-950 text-white">
      <div className="absolute inset-0 about-grain opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(54,166,248,0.15),transparent_60%)]" />
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-brand-500/10 rounded-full blur-3xl animate-glow-pulse" />

      <div className="relative max-w-7xl mx-auto px-4">
        <AboutSectionHeader
          eyebrow="Platform capabilities"
          title={
            <>
              Multi-feature B2B{" "}
              <span className="about-text-gradient">experience</span>
            </>
          }
          subtitle="Everything we built into Lohiya Suppliers — from catalog to cashback, designed for industrial buyers."
          inView={inView}
          dark
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {CAPABILITIES.map((item, i) => (
            <div
              key={item.title}
              className={cn(
                "group relative p-6 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden hover:border-white/20 hover:bg-white/[0.07] transition-all duration-500 hover:-translate-y-1",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${80 + i * 60}ms` }}
            >
              <div
                className={cn(
                  "absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500",
                  item.accent
                )}
              />
              <div
                className={cn(
                  "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300",
                  item.accent
                )}
              >
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{item.title}</h3>
              <p className="text-sm text-brand-100/70 leading-relaxed">{item.desc}</p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
