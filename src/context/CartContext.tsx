"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CartItem } from "@/types/cart";
import { cartItemKey } from "@/types/cart";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "cartKey">, quantity?: number) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  syncPrices: (
    lines: Array<{
      productId: string;
      variationId?: string;
      pricePaise: number;
      name: string;
      slug: string;
      sku: string;
      gstRateBps: number;
      variationLabel?: string;
      image?: string;
    }>
  ) => void;
  clearCart: () => void;
  totalItems: number;
  subtotalPaise: number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lohiya-cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CartItem[];
        setItems(
          parsed.map((item) => ({
            ...item,
            cartKey: item.cartKey || cartItemKey(item.productId, item.variationId),
            pricePaise: item.pricePaise ?? (item as unknown as { price: number }).price * 100,
          }))
        );
      } catch {
        setItems([]);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("lohiya-cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = useCallback((item: Omit<CartItem, "quantity" | "cartKey">, quantity = 1) => {
    const cartKey = cartItemKey(item.productId, item.variationId);
    setItems((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey);
      if (existing) {
        return prev.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, cartKey, quantity }];
    });
  }, []);

  const removeItem = useCallback((cartKey: string) => {
    setItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
  }, []);

  const updateQuantity = useCallback((cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
      return;
    }
    setItems((prev) => prev.map((i) => (i.cartKey === cartKey ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const syncPrices = useCallback(
    (
      lines: Array<{
        productId: string;
        variationId?: string;
        pricePaise: number;
        name: string;
        slug: string;
        sku: string;
        gstRateBps: number;
        variationLabel?: string;
        image?: string;
      }>
    ) => {
      setItems((prev) => {
        let changed = false;
        const next = prev.map((item) => {
          const line = lines.find(
            (l) =>
              l.productId === item.productId &&
              (l.variationId || undefined) === (item.variationId || undefined)
          );
          if (!line) return item;
          if (
            item.pricePaise === line.pricePaise &&
            item.name === line.name &&
            item.sku === line.sku &&
            item.gstRateBps === line.gstRateBps
          ) {
            return item;
          }
          changed = true;
          return {
            ...item,
            pricePaise: line.pricePaise,
            name: line.name,
            slug: line.slug,
            sku: line.sku,
            gstRateBps: line.gstRateBps,
            variationLabel: line.variationLabel,
            image: line.image ?? item.image,
          };
        });
        return changed ? next : prev;
      });
    },
    []
  );

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalPaise = items.reduce((sum, i) => sum + i.pricePaise * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        syncPrices,
        clearCart,
        totalItems,
        subtotalPaise,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
