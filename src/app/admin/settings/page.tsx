import { getPlatformSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();

  const settingsMap = {
    business_name: settings.businessName,
    business_gstin: settings.businessGstin,
    business_state: settings.businessState,
    contact_email: settings.contactEmail,
    contact_phone: settings.contactPhone,
    allow_voucher_cashback_stack: settings.allowVoucherCashbackStack ? "true" : "false",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500 text-sm">Business details, GST config, and platform preferences</p>
      </div>
      <SettingsForm settings={settingsMap} />
    </div>
  );
}
