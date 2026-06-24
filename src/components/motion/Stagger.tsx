"use client";

import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** ms between each direct child */
  step?: number;
  as?: "div" | "ul" | "section" | "tbody" | "nav";
}

/** Staggered entrance — children must be direct descendants (works with CSS grid/flex). */
export function Stagger({
  children,
  className,
  step = 55,
  as: Tag = "div",
}: StaggerProps) {
  return (
    <Tag
      className={cn("motion-stagger-group", className)}
      style={{ "--stagger-step": `${step}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
