import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { CATALOG_IMAGES as IMG } from "@/lib/catalog-images";

interface HeroSlide {
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

export function StaticHero({ slide }: { slide: HeroSlide }) {
  return (
    <section className="relative text-white overflow-hidden min-h-[520px] md:min-h-[600px]">
      <Image
        src={slide.image}
        alt=""
        fill
        priority
        sizes="100vw"
        unoptimized
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-900/75 to-brand-800/40" />

      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium mb-6 border border-white/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Trusted B2B Industrial Partner
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
            {slide.title}
          </h1>
          <p className="text-lg md:text-xl text-brand-100 mb-8 leading-relaxed">{slide.subtitle}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={slide.link}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-900 font-semibold rounded-2xl hover:bg-brand-50 transition-colors shadow-xl shadow-black/20"
            >
              Shop Catalog
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/35 text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors"
            >
              Register for B2B Pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export const DEFAULT_HERO = {
  title: "Precision Cutting & Grinding Solutions",
  subtitle: "Quality abrasives for metal, wood, and industrial fabrication.",
  image: IMG.metalHero,
  link: "/products",
};
