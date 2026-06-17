"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { formatPaise } from "@/lib/utils";
import { Role } from "@prisma/client";

interface Variation {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  defaultPricePaise: number | null;
}

interface ProductPurchaseProps {
  product: {
    id: string;
    slug: string;
    name: string;
    defaultPricePaise: number;
    gstRateBps: number;
    images: string[];
  };
  variations: Variation[];
}

export function ProductPurchasePanel({ product, variations }: ProductPurchaseProps) {
  const { data: session, status } = useSession();
  const isClient = session?.user?.role === Role.CLIENT;

  if (status === "loading") {
    return <div className="mt-8 h-24 bg-gray-50 rounded-xl animate-pulse" />;
  }

  if (!session) {
    return (
      <div className="mt-8 p-5 bg-gray-50 rounded-xl border">
        <p className="text-sm text-gray-600">
          Log in with your B2B client account to see custom pricing and place orders.
        </p>
        <Link
          href={`/login?callbackUrl=/products/${product.slug}`}
          className="inline-flex mt-3 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700"
        >
          Client Login
        </Link>
      </div>
    );
  }

  if (!isClient) {
    return (
      <p className="mt-8 text-sm text-gray-500">
        Admin accounts cannot place orders. Switch to a client account to purchase.
      </p>
    );
  }

  if (variations.length === 0) {
    return (
      <div className="mt-8 space-y-3">
        <p className="text-2xl font-bold text-brand-900">{formatPaise(product.defaultPricePaise)}</p>
        <AddToCartButton
          product={{
            productId: product.id,
            name: product.name,
            slug: product.slug,
            pricePaise: product.defaultPricePaise,
            gstRateBps: product.gstRateBps,
            sku: product.slug.toUpperCase(),
            image: product.images[0],
          }}
        />
        <Link href="/cart" className="block text-center text-sm text-brand-600 hover:underline">
          View cart →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      <h2 className="font-semibold text-gray-900">Select variation & add to cart</h2>
      {variations.map((v) => {
        const label = Object.values(v.attributes).join(" · ") || v.sku;
        const pricePaise = v.defaultPricePaise ?? product.defaultPricePaise;
        return (
          <div
            key={v.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-gray-100 rounded-xl"
          >
            <div>
              <p className="font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 font-mono">{v.sku}</p>
              <p className="font-semibold text-brand-900 mt-1">{formatPaise(pricePaise)}</p>
            </div>
            <AddToCartButton
              className="sm:w-auto sm:min-w-[160px]"
              product={{
                productId: product.id,
                variationId: v.id,
                name: product.name,
                slug: product.slug,
                pricePaise,
                gstRateBps: product.gstRateBps,
                sku: v.sku,
                variationLabel: label,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
