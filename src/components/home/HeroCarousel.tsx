"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  link: string | null;
}

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const slides =
    banners.length > 0
      ? banners
      : [
          {
            id: "default",
            title: "Precision Cutting & Grinding Solutions",
            subtitle: "Quality abrasives for every industry — metal, wood, and beyond.",
            image: null,
            link: "/products",
          },
        ];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[current];

  return (
    <section className="relative text-white overflow-hidden min-h-[560px] md:min-h-[640px]">
      {slide.image ? (
        <>
          <div key={slide.id} className="absolute inset-0 overflow-hidden hero-image-fade">
            <OptimizedImage
              src={slide.image}
              alt=""
              priority={current === 0}
              sizes="100vw"
              className="object-cover hero-ken-burns"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-900/75 to-brand-800/40" />
        </>
      ) : (
        <div className="absolute inset-0 gradient-hero" />
      )}

      <div className="absolute inset-0 opacity-25 pointer-events-none">
        <div className="absolute -top-24 right-1/4 w-[420px] h-[420px] bg-brand-500/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-300/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div key={`copy-${slide.id}`} className="hero-text-enter">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium mb-6 border border-white/20">
              <ShieldCheck className="w-4 h-4 text-brand-300" />
              Trusted B2B Industrial Partner
            </span>
            <h1 className="hero-text-enter-delay text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="hero-text-enter-delay text-lg md:text-xl text-brand-100 mb-8 leading-relaxed max-w-xl">
                {slide.subtitle}
              </p>
            )}
            <div className="hero-cta-enter flex flex-wrap gap-4">
              <Link
                href={slide.link || "/products"}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-900 font-semibold rounded-2xl hover:bg-brand-50 transition-all hover:scale-[1.02] shadow-xl shadow-black/20"
              >
                Shop Catalog
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/35 text-white font-semibold rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-colors"
              >
                Register for B2B Pricing
              </Link>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4 stagger-children">
            {[
              { label: "Deerfros", color: "bg-red-500/90" },
              { label: "Leitz", color: "bg-blue-500/90" },
              { label: "AIPL", color: "bg-amber-500/90" },
              { label: "Custom B2B Rates", color: "bg-brand-500/90" },
            ].map((item) => (
              <div
                key={item.label}
                className="glass-card rounded-2xl p-5 text-brand-950 border-white/40"
              >
                <div className={`w-10 h-1 rounded-full ${item.color} mb-3`} />
                <p className="font-bold text-lg">{item.label}</p>
                <p className="text-sm text-gray-600 mt-1">Authorized distributor</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm transition-colors border border-white/20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => setCurrent((c) => (c + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm transition-colors border border-white/20"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? "w-10 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
