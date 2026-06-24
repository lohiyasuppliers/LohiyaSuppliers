"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealDirection = "up" | "down" | "left" | "right" | "scale" | "none";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
  threshold?: number;
}

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  threshold = 0.12,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -32px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const style = {
    "--motion-delay": `${Math.min(delay, 600)}ms`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={cn(
        "motion-reveal",
        `motion-reveal-${direction}`,
        visible && "motion-reveal-visible",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
