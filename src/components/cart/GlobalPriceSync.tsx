"use client";

import { CartPriceSync } from "./CartPriceSync";

/** Background price sync on all store pages (no UI). */
export function GlobalPriceSync() {
  return <CartPriceSync silent />;
}
