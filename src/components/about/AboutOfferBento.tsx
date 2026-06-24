"use client";

import Link from "next/link";
import { useInView } from "@/hooks/useInView";
import { AboutAnimatedImage } from "@/components/about/AboutAnimatedImage";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfferItem {
  title: string;
  desc: string;
  image: string;
  href: string;
}

export function AboutOfferBento({ items }: { items: OfferItem[] }) {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-24 bg-gray-50 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4">
        <AboutSectionHeader
          eyebrow="Industries"
          title={
            <>
              What we{" "}
              <span className="text-gradient">offer</span>
            </>
          }
          subtitle="Precision solutions for every industrial application — metal, wood, and specialist repair."
          inView={inView}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white about-bento-glow transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl hover:border-brand-200",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className={cn("relative overflow-hidden", i === 0 ? "aspect-[4/3]" : "aspect-video")}>
                <AboutAnimatedImage
                  src={item.image}
                  alt={item.title}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  variant="offer"
                  revealDelay={i * 100}
                />
                <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-brand-800">
                  0{i + 1}
                </div>
                <div className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="p-6 relative">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent" />
                <h3 className="font-bold text-xl text-gray-900 group-hover:text-brand-700 transition-colors pt-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
