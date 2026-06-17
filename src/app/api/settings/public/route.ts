import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/settings";

export async function GET() {
  const s = await getPlatformSettings();
  return NextResponse.json({
    siteName: s.businessName,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    gstNumber: s.businessGstin,
    shippingRate: 0,
    taxRate: 18,
    freeShippingThreshold: 0,
  });
}
