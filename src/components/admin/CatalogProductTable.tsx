"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatPaise } from "@/lib/utils";
import { variationLabel } from "@/lib/variations";
import { ProductActions } from "@/components/admin/ProductActions";
import { CategoryType } from "@prisma/client";

export interface CatalogVariation {
  id: string;
  sku: string;
  label: string | null;
  attributes: Record<string, string>;
  defaultPricePaise: number | null;
  purchasePricePaise: number | null;
  purchasePriceDate: Date | string | null;
  imageUrl: string | null;
  isActive: boolean;
}

export interface CatalogProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  defaultPricePaise: number;
  purchasePricePaise: number | null;
  purchasePriceDate: Date | string | null;
  gstRateBps: number;
  isActive: boolean;
  category: { name: string; type: CategoryType };
  variations: CatalogVariation[];
}

function formatAttrs(attrs: Record<string, string>) {
  const entries = Object.entries(attrs || {}).filter(([, v]) => v?.trim());
  if (entries.length === 0) return "—";
  return entries.map(([k, v]) => `${k}: ${v}`).join(" · ");
}

export function CatalogProductTable({ products }: { products: CatalogProductRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border px-6 py-16 text-center text-gray-500 text-sm">
        No products match your filters. Try adjusting search or filters above.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium w-10" />
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Brand</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">GST</th>
              <th className="text-left px-4 py-3 font-medium">Default Price</th>
              <th className="text-left px-4 py-3 font-medium">Purchase</th>
              <th className="text-left px-4 py-3 font-medium">Variants</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => {
              const isOpen = expanded.has(product.id);
              const count = product.variations.length;
              return (
                <Fragment key={product.id}>
                  <tr key={product.id} className="hover:bg-gray-50/80">
                    <td className="px-2 py-3 text-center">
                      {count > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggle(product.id)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-500"
                          aria-expanded={isOpen}
                          aria-label={isOpen ? "Collapse variants" : "Expand variants"}
                        >
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-medium text-gray-900 hover:text-brand-700"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs font-medium">
                        {product.brand || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.category.name}
                      <span className="block text-xs text-gray-400">
                        {product.category.type === CategoryType.SERVICE ? "Service" : "Product"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{product.gstRateBps / 100}%</td>
                    <td className="px-4 py-3 font-medium">
                      {formatPaise(product.defaultPricePaise)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.purchasePricePaise != null ? (
                        <>
                          <span className="font-medium text-gray-900">
                            {formatPaise(product.purchasePricePaise)}
                          </span>
                          {product.purchasePriceDate && (
                            <span className="block text-xs text-gray-400">
                              {new Date(product.purchasePriceDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {count > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggle(product.id)}
                          className="inline-flex items-center gap-1 text-brand-700 font-medium hover:underline"
                        >
                          {count} variant{count !== 1 ? "s" : ""}
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ProductActions productId={product.id} slug={product.slug} />
                    </td>
                  </tr>
                  {isOpen && count > 0 && (
                    <tr key={`${product.id}-variants`} className="bg-brand-50/30">
                      <td colSpan={10} className="px-4 py-3">
                        <div className="rounded-xl border border-brand-100 bg-white overflow-hidden">
                          <div className="px-4 py-2 border-b border-brand-50 bg-brand-50/50 text-xs font-semibold text-brand-900 uppercase tracking-wide">
                            Variants for {product.name}
                          </div>
                          <table className="w-full text-xs">
                            <thead className="text-gray-500 bg-gray-50/80">
                              <tr>
                                <th className="text-left px-3 py-2 font-medium">Label</th>
                                <th className="text-left px-3 py-2 font-medium">SKU</th>
                                <th className="text-left px-3 py-2 font-medium">Attributes</th>
                                <th className="text-left px-3 py-2 font-medium">Price</th>
                                <th className="text-left px-3 py-2 font-medium">Purchase</th>
                                <th className="text-left px-3 py-2 font-medium">Image</th>
                                <th className="text-left px-3 py-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {product.variations.map((v) => (
                                <tr key={v.id} className="hover:bg-gray-50/50">
                                  <td className="px-3 py-2 font-medium text-gray-900">
                                    {variationLabel({
                                      label: v.label,
                                      attributes: v.attributes,
                                      sku: v.sku,
                                    })}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-gray-600">{v.sku}</td>
                                  <td className="px-3 py-2 text-gray-600 max-w-[200px]">
                                    {formatAttrs(v.attributes)}
                                  </td>
                                  <td className="px-3 py-2 font-medium">
                                    {v.defaultPricePaise != null
                                      ? formatPaise(v.defaultPricePaise)
                                      : "—"}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">
                                    {v.purchasePricePaise != null ? (
                                      <>
                                        {formatPaise(v.purchasePricePaise)}
                                        {v.purchasePriceDate && (
                                          <span className="block text-[10px] text-gray-400">
                                            {new Date(v.purchasePriceDate).toLocaleDateString(
                                              "en-IN"
                                            )}
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {v.imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={v.imageUrl}
                                        alt=""
                                        className="h-8 w-8 object-contain rounded border bg-gray-50"
                                      />
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full ${
                                        v.isActive
                                          ? "bg-green-100 text-green-700"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {v.isActive ? "Active" : "Inactive"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="px-4 py-2 border-t border-gray-100 text-right">
                            <Link
                              href={`/admin/products/${product.slug}/edit`}
                              className="text-xs font-medium text-brand-600 hover:underline"
                            >
                              Edit variants →
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
