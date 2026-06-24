"use client";

import { useInView } from "@/hooks/useInView";
import { AboutAnimatedImage } from "@/components/about/AboutAnimatedImage";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import { MapPin, Building2, TrendingUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AboutBusinessSectionProps {
  workshopImage: string;
  warehouseImage: string;
}

const HIGHLIGHTS = [
  "Authorized brand partnerships",
  "Pan-India B2B delivery",
  "GST-compliant invoicing",
];

export function AboutBusinessSection({ workshopImage, warehouseImage }: AboutBusinessSectionProps) {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="relative py-24 overflow-hidden bg-gray-50">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4">
        <AboutSectionHeader
          eyebrow="Our Story"
          title={
            <>
              Built on grit,{" "}
              <span className="text-gradient">scaled with trust</span>
            </>
          }
          inView={inView}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div
            className={cn(
              "lg:col-span-7 grid grid-cols-2 gap-4 transition-all duration-700 delay-100",
              inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            )}
          >
            <div className="col-span-2 aspect-[16/10] relative rounded-3xl overflow-hidden about-bento-glow group">
              <AboutAnimatedImage
                src={workshopImage}
                alt="Industrial workshop"
                sizes="(max-width: 1024px) 100vw, 55vw"
                variant="card"
                revealDelay={100}
              />
              <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex items-center gap-2 text-white pointer-events-none">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">Industrial Workshop</span>
              </div>
            </div>

            <div className="aspect-square relative rounded-2xl overflow-hidden about-bento-glow">
              <AboutAnimatedImage
                src={warehouseImage}
                alt="Warehouse"
                sizes="(max-width: 1024px) 50vw, 25vw"
                variant="card"
                revealDelay={250}
              />
            </div>

            <div className="aspect-square relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 flex flex-col items-center justify-center text-white p-6 group hover:scale-[1.02] transition-transform duration-500 shadow-xl shadow-brand-900/20">
              <div className="absolute inset-0 opacity-20 about-grain" />
              <TrendingUp className="w-10 h-10 mb-3 opacity-90 group-hover:scale-110 transition-transform relative z-10" />
              <span className="text-4xl font-bold relative z-10">2011</span>
              <span className="text-sm text-brand-200 mt-1 relative z-10">Founded in Jaipur</span>
            </div>
          </div>

          <div
            className={cn(
              "lg:col-span-5 flex flex-col justify-center transition-all duration-700 delay-200",
              inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            )}
          >
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-lg transition-shadow duration-500">
              <h3 className="text-2xl font-bold text-gray-900 mb-5">Our Business</h3>
              <p className="text-gray-600 leading-relaxed mb-4 text-[15px]">
                Established in 2011, Lohiya Suppliers is a proprietorship business led by Mr. Anil Kumar
                Lohiya and operates from Plot No. 145, Ram Nagar Shopping Centre, Shastri Nagar, Jaipur,
                Rajasthan 302016.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6 text-[15px]">
                The company specializes in supplying and trading a broad range of industrial goods, notably
                abrasives and grinding wheels — expanding into valves, motors, conveyor systems, instrumentation,
                stainless steel products, and more.
              </p>

              <ul className="space-y-2.5 mb-6">
                {HIGHLIGHTS.map((h, i) => (
                  <li
                    key={h}
                    className={cn(
                      "flex items-center gap-2.5 text-sm text-gray-700 transition-all duration-500",
                      inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                    )}
                    style={{ transitionDelay: `${400 + i * 80}ms` }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-50 border border-brand-100">
                <MapPin className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Jaipur, Rajasthan</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Serving metal fabrication & woodworking industries nationwide
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
