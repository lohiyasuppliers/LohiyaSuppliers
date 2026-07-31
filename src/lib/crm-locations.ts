/** Build a display address and Google Maps URL from client profile fields. */
export function buildClientLocation(parts: {
  address?: string | null;
  city?: string | null;
  billingState?: string | null;
  pincode?: string | null;
  country?: string | null;
}): { fullAddress: string; mapUrl: string; hasLocation: boolean } {
  const segments = [
    parts.address?.trim(),
    parts.city?.trim(),
    parts.billingState?.trim(),
    parts.pincode?.trim(),
    parts.country?.trim() || "India",
  ].filter(Boolean);

  const fullAddress = segments.join(", ");
  const hasLocation = !!(parts.address?.trim() || parts.city?.trim() || parts.billingState?.trim());

  const mapUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : "";

  return { fullAddress, mapUrl, hasLocation };
}

export const INDIAN_STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  Rajasthan: { lat: 26.9124, lng: 75.7873 },
  Maharashtra: { lat: 19.076, lng: 72.8777 },
  Gujarat: { lat: 23.0225, lng: 72.5714 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462 },
  Haryana: { lat: 28.4595, lng: 77.0266 },
  Punjab: { lat: 30.7333, lng: 76.7794 },
  "Madhya Pradesh": { lat: 23.2599, lng: 77.4126 },
  Karnataka: { lat: 12.9716, lng: 77.5946 },
  "Tamil Nadu": { lat: 13.0827, lng: 80.2707 },
  "West Bengal": { lat: 22.5726, lng: 88.3639 },
  Bihar: { lat: 25.5941, lng: 85.1376 },
  Odisha: { lat: 20.2961, lng: 85.8245 },
  Telangana: { lat: 17.385, lng: 78.4867 },
  "Andhra Pradesh": { lat: 16.5062, lng: 80.648 },
  Kerala: { lat: 9.9312, lng: 76.2673 },
  Assam: { lat: 26.1445, lng: 91.7362 },
  Chhattisgarh: { lat: 21.2514, lng: 81.6296 },
  Jharkhand: { lat: 23.3441, lng: 85.3096 },
  Uttarakhand: { lat: 30.0668, lng: 79.0193 },
  Goa: { lat: 15.2993, lng: 74.124 },
  Himachal: { lat: 31.1048, lng: 77.1734 },
  "Himachal Pradesh": { lat: 31.1048, lng: 77.1734 },
};

export function stateCoords(state: string): { lat: number; lng: number } {
  return INDIAN_STATE_COORDS[state] ?? { lat: 22.5937, lng: 78.9629 };
}
