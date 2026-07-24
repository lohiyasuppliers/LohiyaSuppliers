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
  const { price } = useB2bPrice(productId, defaultPricePaise);

  return (
    <div className="mt-3 pt-3 border-t border-gray-50">
      <span className="text-lg font-bold text-brand-900">from {formatPaise(price)}</span>
    </div>
  );
}
