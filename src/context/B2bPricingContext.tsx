"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { Role } from "@/lib/catalog-shared";
import {
  B2B_CACHE_KEY,
  B2B_CACHE_TTL_MS,
  PRICES_INVALIDATED_EVENT,
  clearB2bPriceCache,
} from "@/lib/b2b-price-cache";

export { clearB2bPriceCache };

type PriceMap = Map<string, number>;

const B2bPricingContext = createContext<{
  getPrice: (productId: string, defaultPaise: number) => { price: number; isCustom: boolean };
  loaded: boolean;
  refresh: () => void;
} | null>(null);

function readPriceCache(idsKey: string): PriceMap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(B2B_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      idsKey: string;
      at: number;
      prices: Record<string, number>;
    };
    if (parsed.idsKey !== idsKey || Date.now() - parsed.at > B2B_CACHE_TTL_MS) return null;
    return new Map(Object.entries(parsed.prices));
  } catch {
    return null;
  }
}

function writePriceCache(idsKey: string, prices: Record<string, number>) {
  try {
    sessionStorage.setItem(
      B2B_CACHE_KEY,
      JSON.stringify({ idsKey, at: Date.now(), prices })
    );
  } catch {
    /* quota */
  }
}

export function B2bPricingProvider({
  productIds,
  children,
}: {
  productIds: string[];
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [priceMap, setPriceMap] = useState<PriceMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fetchGen = useRef(0);

  const idsKey = useMemo(
    () => [...new Set(productIds)].sort().join(","),
    [productIds]
  );

  const fetchPrices = useCallback(
    (skipCache = false) => {
      if (status !== "authenticated" || session?.user?.role !== Role.CLIENT) {
        setLoaded(true);
        return;
      }
      if (!idsKey) {
        setLoaded(true);
        return;
      }

      if (!skipCache) {
        const cached = readPriceCache(idsKey);
        if (cached) {
          setPriceMap(cached);
          setLoaded(true);
          return;
        }
      }

      const gen = ++fetchGen.current;
      setLoaded(false);

      fetch("/api/products/catalog-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ productIds: idsKey.split(",") }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (gen !== fetchGen.current || !data?.prices) return;
          setPriceMap(new Map(Object.entries(data.prices as Record<string, number>)));
          writePriceCache(idsKey, data.prices as Record<string, number>);
        })
        .finally(() => {
          if (gen === fetchGen.current) setLoaded(true);
        });
    },
    [status, session?.user?.role, idsKey]
  );

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchPrices(true);
    };
    const onInvalidated = () => fetchPrices(true);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(PRICES_INVALIDATED_EVENT, onInvalidated);
    const interval = setInterval(() => fetchPrices(true), B2B_CACHE_TTL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(PRICES_INVALIDATED_EVENT, onInvalidated);
      clearInterval(interval);
    };
  }, [fetchPrices]);

  const getPrice = useCallback(
    (productId: string, defaultPaise: number) => {
      const custom = priceMap?.get(productId);
      if (custom != null && custom !== defaultPaise) {
        return { price: custom, isCustom: true };
      }
      return { price: custom ?? defaultPaise, isCustom: false };
    },
    [priceMap]
  );

  const refresh = useCallback(() => fetchPrices(true), [fetchPrices]);

  return (
    <B2bPricingContext.Provider value={{ getPrice, loaded, refresh }}>
      {children}
    </B2bPricingContext.Provider>
  );
}

export function useB2bPrice(productId: string, defaultPaise: number) {
  const ctx = useContext(B2bPricingContext);
  if (!ctx) return { price: defaultPaise, isCustom: false, loaded: true };
  return { ...ctx.getPrice(productId, defaultPaise), loaded: ctx.loaded };
}
