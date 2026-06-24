"use client";

import { formatPaise } from "@/lib/utils";
import { useB2bPrice } from "@/context/B2bPricingContext";

export function ProductCardPrice({
  productId,
  defaultPricePaise,
}: {
  productId: string;
  defaultPricePaise: number;
}) {
  const { price, isCustom } = useB2bPrice(productId, defaultPricePaise);

  return (
    <div className="mt-3 pt-3 border-t border-gray-50">
      {isCustom && (
        <span className="text-xs text-emerald-600 font-medium block mb-0.5">Your B2B price</span>
      )}
      <span className="text-lg font-bold text-brand-900">
        {isCustom ? "" : "from "}
        {formatPaise(price)}
      </span>
      {isCustom && (
        <span className="text-xs text-gray-400 line-through ml-2">
          {formatPaise(defaultPricePaise)}
        </span>
      )}
    </div>
  );
}
