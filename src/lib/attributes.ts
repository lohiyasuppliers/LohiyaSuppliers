/** Normalize variation attribute keys/values before save or SKU generation. */
export function sanitizeAttributes(attrs: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [rawKey, rawVal] of Object.entries(attrs)) {
    const key = rawKey.trim().toLowerCase();
    if (!key) continue;
    out[key] = String(rawVal ?? "").trim();
  }
  return out;
}
