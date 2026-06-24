import { requireClient } from "@/lib/session";
import { fetchCashbackWalletData } from "@/lib/cashback-page-data";
import { CashbackWalletClient } from "./CashbackWalletClient";

export const metadata = { title: "Cashback Wallet" };
export const dynamic = "force-dynamic";

export default async function CashbackWalletPage() {
  const session = await requireClient();
  const initial = await fetchCashbackWalletData(session.user.id);
  return <CashbackWalletClient initial={initial} />;
}
