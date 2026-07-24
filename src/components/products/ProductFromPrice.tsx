"use client";

import { formatPaise } from "@/lib/utils";
import { useProductPricing } from "@/context/ProductPricingContext";

export function ProductFromPrice({ listFromPricePaise }: { listFromPricePaise: number }) {
  const { fromPricePaise } = useProductPricing(listFromPricePaise);

  return (
    <p className="text-2xl font-bold text-brand-900 mt-4">from {formatPaise(fromPricePaise)}</p>
  );
}
