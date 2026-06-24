"use client";

import { useInView } from "@/hooks/useInView";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import { Target, Eye, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

const VALUES = [
  {
    icon: Target,
    title: "Our Mission",
    text: "Deliver genuine industrial-grade abrasives and engineering supplies with reliability, speed, and transparent B2B partnerships.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    text: "Become India's most trusted name in industrial supply — where quality products meet modern operations and nationwide reach.",
  },
  {
    icon: HeartHandshake,
    title: "Our Promise",
    text: "Authorized brands, fair pricing, and dedicated support — from first enquiry to repeat bulk orders across metal and wood industries.",
  },
];

export function AboutValues() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="relative py-24 overflow-hidden bg-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent" />
        <div className="absolute -top-40 right-0 w-[480px] h-[480px] bg-brand-50 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        <AboutSectionHeader
          eyebrow="What drives us"
          title={
            <>
              Mission, vision &{" "}
              <span className="text-gradient">values</span>
            </>
          }
          subtitle="The principles that guide every order, partnership, and product we deliver."
          inView={inView}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {VALUES.map((item, i) => (
            <div
              key={item.title}
              className={cn(
                "group relative p-8 rounded-3xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 transition-all duration-700 hover:border-brand-200 hover:shadow-xl hover:-translate-y-1",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              )}
              style={{ transitionDelay: `${150 + i * 100}ms` }}
            >
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-brand-300/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />

              <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mb-6 shadow-lg shadow-brand-600/20 group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300">
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.text}</p>

              <span className="absolute bottom-6 right-6 text-5xl font-bold text-brand-100 select-none group-hover:text-brand-200 transition-colors">
                0{i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
