"use client";

import { AboutAnimatedImage } from "@/components/about/AboutAnimatedImage";
import { Sparkles, ArrowDown } from "lucide-react";

interface AboutHeroProps {
  image: string;
  productCount: number;
  categoryCount: number;
}

export function AboutHero({ image, productCount, categoryCount }: AboutHeroProps) {
  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden about-grain">
      <div className="absolute inset-0">
        <AboutAnimatedImage
          src={image}
          alt="Industrial workshop"
          sizes="100vw"
          priority
          variant="hero"
          showCorners={false}
          showScan
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/92 via-brand-900/78 to-brand-700/45 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(54,166,248,0.3),transparent_55%)] z-10 pointer-events-none" />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-brand-400/15 blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-20 -left-24 w-96 h-96 rounded-full bg-accent-400/10 blur-3xl animate-float" />
        <svg className="absolute top-24 right-[12%] w-32 h-32 text-white/5 animate-rotate-slow" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 8" />
        </svg>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 py-24 w-full">
        <div className="max-w-4xl">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-sm font-medium text-white mb-8 animate-bounce-in">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Since 2011 · Jaipur, Rajasthan
          </span>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6 animate-slide-in-left">
            About{" "}
            <span className="about-text-gradient">Lohiya</span>
            <br />
            Suppliers
          </h1>

          <p
            className="text-lg md:text-xl text-brand-100/90 max-w-2xl leading-relaxed mb-10 animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            Supplying top-grade abrasives and industrial engineering products — powering metal fabrication
            and woodworking industries across India and beyond.
          </p>

          <div className="flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: "350ms" }}>
            {[
              `${productCount}+ Products`,
              `${categoryCount}+ Categories`,
              "B2B Trusted",
              "GST Ready",
            ].map((tag, i) => (
              <span
                key={tag}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                style={{ animationDelay: `${400 + i * 80}ms` }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden md:flex absolute bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-white/40 animate-float">
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <ArrowDown className="w-4 h-4" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-gray-50 to-transparent z-20 pointer-events-none" />
    </section>
  );
}
