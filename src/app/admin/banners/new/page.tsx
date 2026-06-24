import { redirect } from "next/navigation";
export default function LegacyBannerPage() {
  redirect("/admin/banners");
}
