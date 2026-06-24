"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ProductPricingData = {
  fromPricePaise: number;
  listFromPricePaise: number;
  defaultPricePaise: number;
  listPricePaise: number;
  isCustomPricing: boolean;
  variations: Array<{
    id: string;
    sku: string;
    attributes: Record<string, string>;
    pricePaise: number;
    listPricePaise: number;
    cashbackPaise?: number;
  }>;
  productCashbackPaise?: number;
};

const ProductPricingContext = createContext<{
  data: ProductPricingData | null;
  loading: boolean;
} | null>(null);

export function ProductPricingProvider({
  slug,
  listFromPricePaise,
  children,
}: {
  slug: string;
  listFromPricePaise: number;
  children: ReactNode;
}) {
  const [data, setData] = useState<ProductPricingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    function load() {
      fetch(`/api/products/${slug}/pricing`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (cancelled || !json) return;
          setData({
            fromPricePaise: json.fromPricePaise ?? listFromPricePaise,
            listFromPricePaise: json.listFromPricePaise ?? listFromPricePaise,
            defaultPricePaise: json.defaultPricePaise ?? listFromPricePaise,
            listPricePaise: json.listPricePaise ?? listFromPricePaise,
            isCustomPricing: !!json.isCustomPricing,
            productCashbackPaise: json.productCashbackPaise ?? 0,
            variations: json.variations ?? [],
          });
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    load();

    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [slug, listFromPricePaise]);

  return (
    <ProductPricingContext.Provider value={{ data, loading }}>
      {children}
    </ProductPricingContext.Provider>
  );
}

export function useProductPricing(fallbackListFrom: number) {
  const ctx = useContext(ProductPricingContext);
  if (!ctx) {
    return {
      loading: false,
      fromPricePaise: fallbackListFrom,
      listFromPricePaise: fallbackListFrom,
      defaultPricePaise: fallbackListFrom,
      isCustomPricing: false,
      variationPrices: {} as Record<string, number>,
      variationCashback: {} as Record<string, number>,
      productCashbackPaise: 0,
    };
  }

  const { data, loading } = ctx;
  const variationPrices: Record<string, number> = {};
  const variationCashback: Record<string, number> = {};
  if (data?.variations) {
    for (const v of data.variations) {
      variationPrices[v.id] = v.pricePaise;
      variationCashback[v.id] = v.cashbackPaise ?? 0;
    }
  }

  return {
    loading,
    fromPricePaise: data?.fromPricePaise ?? fallbackListFrom,
    listFromPricePaise: data?.listFromPricePaise ?? fallbackListFrom,
    defaultPricePaise: data?.defaultPricePaise ?? fallbackListFrom,
    isCustomPricing: data?.isCustomPricing ?? false,
    variationPrices,
    variationCashback,
    productCashbackPaise: data?.productCashbackPaise ?? 0,
  };
}
