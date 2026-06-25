"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

const MILESTONES = [
  { year: "2011", title: "Founded in Jaipur", desc: "Proprietorship business established by Mr. Anil Kumar Lohiya." },
  { year: "2015", title: "Brand partnerships", desc: "Authorized Deerfros, Leitz, and AIPL distribution." },
  { year: "2020", title: "Nationwide reach", desc: "Pan-India B2B supply for metal & wood industries." },
  { year: "2024", title: "Digital platform", desc: "Online catalog, custom pricing, and cashback wallet." },
  { year: "2026", title: "Scaling operations", desc: "Technology-led growth across engineering supplies." },
];

export function AboutMilestoneTimeline() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        <div
          className={cn(
            "text-center mb-14 transition-all duration-700",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Our journey</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">
            Milestones that <span className="text-gradient">shaped us</span>
          </h2>
        </div>

        <div className="relative">
          <div
            className={cn(
              "hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 origin-left",
              inView ? "scale-x-100" : "scale-x-0"
            )}
            style={{ transition: "transform 1.2s ease-out" }}
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
            {MILESTONES.map((m, i) => (
              <div
                key={m.year}
                className={cn(
                  "relative text-center md:text-left transition-all duration-700",
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${200 + i * 120}ms` }}
              >
                <div className="hidden md:flex w-4 h-4 rounded-full bg-brand-600 border-4 border-white shadow-md mx-auto md:mx-0 mb-6 relative z-10 about-timeline-dot" />
                <span className="inline-block text-2xl font-bold text-brand-600 mb-2">{m.year}</span>
                <h3 className="font-bold text-gray-900 mb-1">{m.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
