"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface AddToCartButtonProps {
  product: {
    productId: string;
    variationId?: string;
    name: string;
    slug: string;
    pricePaise: number;
    gstRateBps: number;
    sku: string;
    image?: string;
    variationLabel?: string;
  };
  className?: string;
}

export function AddToCartButton({ product, className = "" }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleAdd}
      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
        added ? "bg-green-500 text-white" : "bg-brand-600 text-white hover:bg-brand-700"
      } ${className}`}
    >
      {added ? (
        <>
          <Check className="w-4 h-4" />
          Added!
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </>
      )}
    </button>
  );
}
