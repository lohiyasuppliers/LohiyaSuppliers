"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { formatPaise } from "@/lib/utils";
import {
  orderedAttributeKeys,
  optionsForAttribute,
  findVariationByAttributes,
  initialSelectedAttributes,
  variationLabel,
  formatAttributeLabel,
  isSparseVariationSet,
  normalizeAttributes,
} from "@/lib/variations";
import { Role } from "@/lib/catalog-shared";
import { useProductPricing } from "@/context/ProductPricingContext";
import { Minus, Plus, Tag, Gift } from "lucide-react";

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
  const isAdmin = session?.user?.role === Role.ADMIN;

  const normalizedVariations = useMemo(
    () =>
      variations.map((v) => ({
        ...v,
        attributes: normalizeAttributes(v.attributes),
      })),
    [variations]
  );

  const attrKeys = useMemo(
    () => orderedAttributeKeys(normalizedVariations),
    [normalizedVariations]
  );
  const sparse = useMemo(
    () => isSparseVariationSet(normalizedVariations),
    [normalizedVariations]
  );

  const [lastChangedKey, setLastChangedKey] = useState<string | null>(null);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() =>
    initialSelectedAttributes(normalizedVariations, orderedAttributeKeys(normalizedVariations))
  );
  useEffect(() => {
    if (normalizedVariations.length === 0) return;
    const keys = orderedAttributeKeys(normalizedVariations);
    setSelectedAttrs(initialSelectedAttributes(normalizedVariations, keys));
    setLastChangedKey(keys[0] ?? null);
  }, [normalizedVariations]);

  const [quantity, setQuantity] = useState(1);
  const {
    loading: loadingPrices,
    defaultPricePaise: defaultPrice,
    isCustomPricing: customPricing,
    variationPrices: prices,
    variationCashback,
    productCashbackPaise,
  } = useProductPricing(product.defaultPricePaise);

  const selected = useMemo(
    () =>
      findVariationByAttributes(
        normalizedVariations,
        selectedAttrs,
        attrKeys,
        lastChangedKey ?? undefined
      ),
    [normalizedVariations, selectedAttrs, attrKeys, lastChangedKey]
  );

  const handleAttributeChange = (key: string, value: string) => {
    setLastChangedKey(key);
    setSelectedAttrs((prev) => {
      const next = { ...prev, [key]: value };

      if (sparse) {
        return next;
      }

      if (findVariationByAttributes(normalizedVariations, next, attrKeys)) {
        return next;
      }

      const pool = normalizedVariations.filter((v) => {
        const attrs = v.attributes;
        return Object.entries(next).every(([k, val]) => !val || attrs[k] === val);
      });

      if (pool[0]) {
        const attrs = pool[0].attributes;
        return Object.fromEntries(attrKeys.map((k) => [k, attrs[k] ?? next[k] ?? ""]));
      }

      return next;
    });
  };

  const unitPrice = selected
    ? prices[selected.id] ?? selected.defaultPricePaise ?? defaultPrice
    : defaultPrice;

  const unitCashback = selected
    ? variationCashback[selected.id] ?? productCashbackPaise
    : productCashbackPaise;

  if (isAdmin) {
    return (
      <p className="mt-8 text-sm text-gray-500 rounded-xl border border-amber-100 bg-amber-50 p-4">
        Admin accounts cannot place orders. Switch to a client account to purchase.
      </p>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg shadow-brand-900/5 space-y-5 animate-fade-in-up">
      {customPricing && isClient && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
          Your custom B2B pricing applied
        </span>
      )}

      {isClient && unitCashback > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-100">
          <Gift className="w-3.5 h-3.5" />
          Earn {formatPaise(unitCashback)} cashback per unit
        </span>
      )}

      {!session && status !== "loading" && (
        <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
          Prices shown are list prices.{" "}
          <Link
            href={`/login?callbackUrl=/products/${product.slug}`}
            className="text-brand-600 font-medium hover:underline"
          >
            Log in
          </Link>{" "}
          for your custom B2B rates.
        </p>
      )}

      {normalizedVariations.length > 0 && attrKeys.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-900">Choose variant options</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attrKeys.map((key) => {
              const options = optionsForAttribute(normalizedVariations, key, selectedAttrs);
              if (options.length === 0) return null;
              const selectId = `variant-${product.slug}-${key}`;
              const label = formatAttributeLabel(key);
              return (
                <div
                  key={key}
                  className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2"
                >
                  <label htmlFor={selectId} className="text-sm font-semibold text-gray-900 block">
                    {label}
                  </label>
                  <select
                    id={selectId}
                    value={selectedAttrs[key] ?? ""}
                    onChange={(e) => handleAttributeChange(key, e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all cursor-pointer hover:border-brand-300 capitalize"
                  >
                    <option value="" disabled>
                      Select {label.toLowerCase()}
                    </option>
                    {options.map((opt) => (
                      <option key={opt} value={opt} className="capitalize">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {selected ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-brand-500" />
                <span>SKU:</span>
                <code className="font-mono text-brand-800 font-semibold">{selected.sku}</code>
              </div>
              <span className="text-gray-400">|</span>
              <span>
                Selected:{" "}
                <strong className="text-brand-900 capitalize">{variationLabel(selected)}</strong>
              </span>
              <span className="text-gray-400">|</span>
              <span>
                Unit:{" "}
                <strong className="text-brand-900">
                  {loadingPrices ? "..." : formatPaise(unitPrice)}
                </strong>
              </span>
            </div>
          ) : (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Pick an option from each dropdown to select your variant.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-900">Quantity</label>
        <div className="flex items-center gap-1 border-2 border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-2.5 hover:bg-brand-50 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center font-bold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="p-2.5 hover:bg-brand-50 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-sm text-gray-500">Total</span>
          <span className="text-3xl font-bold text-brand-900">
            {loadingPrices ? "..." : formatPaise(unitPrice * quantity)}
          </span>
        </div>

        {normalizedVariations.length > 0 && selected ? (
          <AddToCartButton
            quantity={quantity}
            product={{
              productId: product.id,
              variationId: selected.id,
              name: product.name,
              slug: product.slug,
              pricePaise: unitPrice,
              gstRateBps: product.gstRateBps,
              sku: selected.sku,
              variationLabel: variationLabel(selected),
              image: product.images[0],
            }}
          />
        ) : (
          <AddToCartButton
            quantity={quantity}
            disabled={normalizedVariations.length > 0 && !selected}
            product={{
              productId: product.id,
              name: product.name,
              slug: product.slug,
              pricePaise: unitPrice,
              gstRateBps: product.gstRateBps,
              sku: product.slug.toUpperCase().replace(/-/g, ""),
              image: product.images[0],
            }}
          />
        )}

        <Link href="/cart" className="block text-center text-sm text-brand-600 hover:underline mt-3">
          View cart →
        </Link>
      </div>
    </div>
  );
}
