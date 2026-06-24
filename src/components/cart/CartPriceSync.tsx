"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { Role } from "@/lib/catalog-shared";
import { PRICES_INVALIDATED_EVENT } from "@/lib/b2b-price-cache";

const REFRESH_MS = 45_000;

/** Re-sync cart line prices from server (B2B custom pricing + admin price updates). */
export function CartPriceSync({ silent = false }: { silent?: boolean }) {
  const { data: session, status } = useSession();
  const { items, isLoaded, syncPrices } = useCart();
  const [customCount, setCustomCount] = useState(0);
  const [priceUpdated, setPriceUpdated] = useState(false);
  const lastSyncAt = useRef(0);

  const cartSig = useMemo(
    () =>
      items
        .map((i) => `${i.productId}:${i.variationId ?? ""}:${i.quantity}`)
        .sort()
        .join("|"),
    [items]
  );

  const runSync = useCallback(
    (force = false) => {
      if (!isLoaded || status !== "authenticated") return;
      if (session?.user?.role !== Role.CLIENT || items.length === 0) return;

      const now = Date.now();
      if (!force && now - lastSyncAt.current < 5_000) return;
      lastSyncAt.current = now;

      fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variationId: i.variationId,
            quantity: i.quantity,
          })),
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.items) return;

          const pricesDiffer = data.items.some(
            (line: { productId: string; variationId?: string; pricePaise: number }) => {
              const item = items.find(
                (i) =>
                  i.productId === line.productId &&
                  (i.variationId || undefined) === (line.variationId || undefined)
              );
              return item && item.pricePaise !== line.pricePaise;
            }
          );

          if (pricesDiffer) {
            syncPrices(data.items);
            setPriceUpdated(true);
            setTimeout(() => setPriceUpdated(false), 4000);
          }
          setCustomCount(
            data.items.filter((l: { isCustomPrice: boolean }) => l.isCustomPrice).length
          );
        })
        .catch(() => {});
    },
    [isLoaded, status, session?.user?.role, items, syncPrices]
  );

  useEffect(() => {
    runSync(true);
  }, [cartSig, runSync]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") runSync(true);
    };
    const onInvalidated = () => runSync(true);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(PRICES_INVALIDATED_EVENT, onInvalidated);
    const interval = setInterval(() => runSync(), REFRESH_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(PRICES_INVALIDATED_EVENT, onInvalidated);
      clearInterval(interval);
    };
  }, [runSync]);

  if (silent && !priceUpdated && customCount === 0) return null;

  if (priceUpdated) {
    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 animate-scale-in">
        Prices updated to match the latest catalog rates.
      </div>
    );
  }

  if (customCount === 0) return null;

  return (
    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 animate-fade-in">
      Your B2B custom pricing is applied to {customCount} item(s) in your cart.
    </div>
  );
}
