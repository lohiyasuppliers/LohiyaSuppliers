"use client";

import Link from "next/link";
import { useInView } from "@/hooks/useInView";
import { AboutAnimatedImage } from "@/components/about/AboutAnimatedImage";
import { ArrowRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface AboutCTAProps {
  image: string;
}

export function AboutCTA({ image }: AboutCTAProps) {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div
          className={cn(
            "relative rounded-[2rem] overflow-hidden border border-brand-800/30 shadow-2xl transition-all duration-700",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          )}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[360px]">
            <div className="relative hidden lg:block min-h-[360px]">
              <AboutAnimatedImage
                src={image}
                alt="Industrial operations"
                sizes="50vw"
                variant="offer"
                revealDelay={200}
                showScan
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-brand-950/90" />
            </div>

            <div className="relative bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-10 md:p-14 flex flex-col justify-center about-grain">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl animate-glow-pulse" />
              </div>

              <span
                className={cn(
                  "inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold uppercase tracking-widest text-brand-200 mb-6 transition-all duration-700 delay-100",
                  inView ? "opacity-100" : "opacity-0"
                )}
              >
                Partner with us
              </span>

              <h2
                className={cn(
                  "text-3xl md:text-4xl font-bold text-white leading-tight mb-4 transition-all duration-700 delay-150",
                  inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
                )}
              >
                Ready to power your next industrial project?
              </h2>
              <p
                className={cn(
                  "text-brand-100/80 leading-relaxed mb-8 max-w-md transition-all duration-700 delay-200",
                  inView ? "opacity-100" : "opacity-0"
                )}
              >
                Browse 37+ products across metal and wood applications — with B2B pricing,
                GST invoicing, and nationwide delivery from Jaipur.
              </p>

              <div
                className={cn(
                  "flex flex-wrap gap-4 transition-all duration-700 delay-300",
                  inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-brand-900 font-semibold rounded-xl hover:bg-brand-50 transition-all hover:shadow-lg hover:gap-3 group"
                >
                  Explore Products
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-white/25 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
