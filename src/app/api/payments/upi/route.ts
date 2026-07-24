import { NextResponse } from "next/server";
import { getCachedSettings } from "@/lib/cache";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/constants";

/** Public UPI payment details for checkout scanner (no secrets). */
export async function GET() {
  try {
    const s = await getCachedSettings();
    return NextResponse.json({
      upiId: s.paymentUpiId || DEFAULT_PLATFORM_SETTINGS.payment_upi_id,
      upiName: s.paymentUpiName || DEFAULT_PLATFORM_SETTINGS.payment_upi_name,
      qrUrl: s.paymentQrUrl || DEFAULT_PLATFORM_SETTINGS.payment_qr_url,
      note: s.paymentNote || DEFAULT_PLATFORM_SETTINGS.payment_note,
    });
  } catch {
    return NextResponse.json({
      upiId: DEFAULT_PLATFORM_SETTINGS.payment_upi_id,
      upiName: DEFAULT_PLATFORM_SETTINGS.payment_upi_name,
      qrUrl: DEFAULT_PLATFORM_SETTINGS.payment_qr_url,
      note: DEFAULT_PLATFORM_SETTINGS.payment_note,
    });
  }
}
