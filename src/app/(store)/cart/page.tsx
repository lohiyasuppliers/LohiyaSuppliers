"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPaise } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotalPaise, totalItems } = useCart();

  const taxPaise = items.reduce(
    (sum, i) => sum + Math.round((i.pricePaise * i.quantity * i.gstRateBps) / 10000),
    0
  );
  const totalPaise = subtotalPaise + taxPaise;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Browse the catalog and add items to your cart</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700"
        >
          Browse Catalog <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Shopping Cart ({totalItems} items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.cartKey}
              className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 text-2xl">
                ⚙️
              </div>
              <div className="flex-1">
                <Link
                  href={`/products/${item.slug}`}
                  className="font-medium text-gray-900 hover:text-brand-700"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5">
                  SKU: {item.sku}
                  {item.variationLabel ? ` · ${item.variationLabel}` : ""}
                </p>
                <p className="text-brand-700 font-bold mt-1">{formatPaise(item.pricePaise)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeItem(item.cartKey)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                    className="p-1.5 hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                    className="p-1.5 hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="font-bold text-gray-900">
                  {formatPaise(item.pricePaise * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 h-fit sticky top-24">
          <h2 className="font-bold text-lg text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatPaise(subtotalPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GST</span>
              <span>{formatPaise(taxPaise)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-brand-900">{formatPaise(totalPaise)}</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
