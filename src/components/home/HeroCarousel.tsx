"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  link: string | null;
}

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const slides = banners.length > 0 ? banners : [{
    id: "default",
    title: "Precision Cutting & Grinding Solutions",
    subtitle: "Quality abrasives for every industry — metal, wood, and beyond.",
    image: null,
    link: "/products",
  }];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[current];

  return (
    <section className="relative text-white overflow-hidden min-h-[520px] md:min-h-[600px]">
      {slide.image ? (
        <>
          <Image
            src={slide.image}
            alt=""
            fill
            priority={current === 0}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-900/80 to-brand-800/50" />
        </>
      ) : (
        <div className="absolute inset-0 gradient-hero" />
      )}

      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-300 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 relative h-full flex items-center">
        <div className="max-w-3xl animate-slide-in-left">
          <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium mb-6 border border-white/20">
            Trusted B2B Industrial Partner
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 tracking-tight">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="text-lg md:text-xl text-brand-100 mb-8 leading-relaxed max-w-2xl">
              {slide.subtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            <Link
              href={slide.link || "/products"}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-brand-900 font-semibold rounded-xl hover:bg-brand-50 transition-all hover:scale-105 shadow-lg"
            >
              Shop Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 backdrop-blur-sm transition-colors"
            >
              Get Bulk Quote
            </Link>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => setCurrent((c) => (c + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? "w-8 bg-white" : "w-2 bg-white/40"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
