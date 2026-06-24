"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type PageVariant = "store" | "admin" | "account";

const variantClass: Record<PageVariant, string> = {
  store: "motion-page-store",
  admin: "motion-page-admin",
  account: "motion-page-account",
};

/** Animates page content on every route/tab change. */
export function PageTransition({
  children,
  variant = "store",
  className,
}: {
  children: React.ReactNode;
  variant?: PageVariant;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={cn(variantClass[variant], className)}>
      {children}
    </div>
  );
}
