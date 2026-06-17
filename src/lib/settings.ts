import { prisma } from "./prisma";
import { DEFAULT_PLATFORM_SETTINGS } from "./constants";

export async function getPlatformSettings() {
  const rows = await prisma.platformSetting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    businessName: map.business_name ?? DEFAULT_PLATFORM_SETTINGS.business_name,
    businessGstin: map.business_gstin ?? DEFAULT_PLATFORM_SETTINGS.business_gstin,
    businessState: map.business_state ?? DEFAULT_PLATFORM_SETTINGS.business_state,
    allowVoucherCashbackStack:
      (map.allow_voucher_cashback_stack ?? DEFAULT_PLATFORM_SETTINGS.allow_voucher_cashback_stack) ===
      "true",
    contactEmail: map.contact_email ?? DEFAULT_PLATFORM_SETTINGS.contact_email,
    contactPhone: map.contact_phone ?? DEFAULT_PLATFORM_SETTINGS.contact_phone,
  };
}

export async function upsertPlatformSetting(key: string, value: string) {
  return prisma.platformSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/** @deprecated Use getPlatformSettings — kept for legacy layout during migration */
export async function getSettings() {
  const s = await getPlatformSettings();
  return {
    siteName: s.businessName,
    siteTagline: "B2B Industrial Abrasives & Tools",
    contactPhone: s.contactPhone,
    contactEmail: s.contactEmail,
    contactAddress: "",
    gstNumber: s.businessGstin,
    businessHours: "Mon–Sat: 9AM – 6PM",
  };
}
