"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
