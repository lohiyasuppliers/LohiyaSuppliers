"use client";

import { formatPaise } from "@/lib/utils";
import { useProductPricing } from "@/context/ProductPricingContext";

export function ProductFromPrice({ listFromPricePaise }: { listFromPricePaise: number }) {
  const { fromPricePaise, listFromPricePaise: listPrice, isCustomPricing } =
    useProductPricing(listFromPricePaise);

  return (
    <p className="text-2xl font-bold text-brand-900 mt-4">
      {!isCustomPricing && "from "}
      {formatPaise(fromPricePaise)}
      {isCustomPricing && listPrice !== fromPricePaise && (
        <span className="text-base font-normal text-gray-400 line-through ml-2">
          {formatPaise(listPrice)}
        </span>
      )}
    </p>
  );
}
