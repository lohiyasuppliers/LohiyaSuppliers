"use client";

import { B2bPricingProvider } from "@/context/B2bPricingContext";

/** Thin client shell — keeps product cards server-rendered as children. */
export function PricedProductGrid({
  productIds,
  children,
}: {
  productIds: string[];
  children: React.ReactNode;
}) {
  return <B2bPricingProvider productIds={productIds}>{children}</B2bPricingProvider>;
}
