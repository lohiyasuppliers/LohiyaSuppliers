"use client";

import { useEffect, useState } from "react";
import { Award, Globe, Package, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  icon: typeof Package;
  value: number;
  suffix?: string;
  label: string;
  accent: string;
}

function CountUp({ target, active, suffix = "" }: { target: number; active: boolean; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [active, target]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

export function AboutStats({
  productCount,
  categoryCount,
  orderCount,
  active = true,
}: {
  productCount: number;
  categoryCount: number;
  orderCount: number;
  active?: boolean;
}) {
  const stats: StatItem[] = [
    { icon: Package, value: productCount, suffix: "+", label: "Active Products", accent: "from-brand-500 to-brand-700" },
    { icon: Award, value: categoryCount, label: "Industry Categories", accent: "from-accent-400 to-accent-600" },
    { icon: Globe, value: 0, label: "Worldwide Shipping", accent: "from-emerald-400 to-emerald-600" },
    { icon: Shield, value: orderCount, label: "Orders Delivered", accent: "from-violet-400 to-violet-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center transition-all duration-700 hover:border-white/20 hover:bg-white/[0.08]",
            active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
          style={{ transitionDelay: `${200 + i * 100}ms` }}
        >
          <div
            className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-[0.12] transition-opacity duration-500 bg-gradient-to-br",
              stat.accent
            )}
          />
          <div className="relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-brand-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/10">
              <stat.icon className="w-6 h-6 text-brand-300" />
            </div>
            <div className="text-3xl md:text-4xl font-bold text-white mb-1 tabular-nums">
              {stat.label === "Worldwide Shipping" ? (
                <span className="bg-gradient-to-r from-brand-300 to-white bg-clip-text text-transparent">
                  Global
                </span>
              ) : (
                <CountUp target={stat.value} active={active} suffix={stat.suffix} />
              )}
            </div>
            <div className="text-sm text-brand-200/80">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
