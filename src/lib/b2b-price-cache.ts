/** Client-side B2B catalog price cache — bust when admin updates prices. */
export const B2B_CACHE_KEY = "lohiya-b2b-prices";
export const B2B_CACHE_TTL_MS = 30_000;
export const PRICES_INVALIDATED_EVENT = "lohiya-prices-invalidated";

export function clearB2bPriceCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(B2B_CACHE_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(PRICES_INVALIDATED_EVENT));
}
