"use client";

import { cn } from "@/lib/utils";

interface AboutSectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  inView: boolean;
  dark?: boolean;
  align?: "center" | "left";
  className?: string;
}

export function AboutSectionHeader({
  eyebrow,
  title,
  subtitle,
  inView,
  dark = false,
  align = "center",
  className,
}: AboutSectionHeaderProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "mb-14 md:mb-16",
        centered ? "text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "inline-block text-xs md:text-sm font-bold uppercase tracking-[0.25em] mb-4 transition-all duration-700",
            dark ? "text-brand-300" : "text-brand-600",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "text-3xl md:text-5xl font-bold tracking-tight transition-all duration-700 delay-75",
          dark ? "text-white" : "text-gray-900",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}
      >
        {title}
      </h2>
      <div
        className={cn(
          "h-0.5 w-20 mt-6 rounded-full bg-gradient-to-r from-brand-600 to-accent-400 transition-all duration-700 delay-150",
          centered ? "mx-auto" : "",
          inView ? "about-header-line-active" : "scale-x-0"
        )}
      />
      {subtitle && (
        <p
          className={cn(
            "mt-5 text-base md:text-lg max-w-2xl leading-relaxed transition-all duration-700 delay-200",
            centered ? "mx-auto" : "",
            dark ? "text-brand-200/75" : "text-gray-500",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
