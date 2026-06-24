"use client";

import { useInView } from "@/hooks/useInView";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import { AboutStats } from "@/components/about/AboutStats";

interface AboutStatsSectionProps {
  productCount: number;
  categoryCount: number;
  orderCount: number;
}

export function AboutStatsSection({
  productCount,
  categoryCount,
  orderCount,
}: AboutStatsSectionProps) {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 animate-gradient-shift" />
      <div className="absolute inset-0 about-grain" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-400/10 rounded-full blur-3xl animate-glow-pulse" />

      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4">
        <AboutSectionHeader
          eyebrow="Performance"
          title={
            <>
              By the{" "}
              <span className="about-text-gradient">numbers</span>
            </>
          }
          subtitle="Real impact, measurable growth — built over a decade of industrial supply."
          inView={inView}
          dark
        />
        <AboutStats
          productCount={productCount}
          categoryCount={categoryCount}
          orderCount={orderCount}
          active={inView}
        />
      </div>
    </section>
  );
}
