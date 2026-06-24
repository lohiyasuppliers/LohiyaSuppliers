import { requireAuth } from "@/lib/session";
import { getPayableOrders, summarizePayable, getPendingVerificationOrders } from "@/lib/payable-orders";
import {
  PendingPaymentAlert,
  PendingPaymentPopup,
  type PaymentSummary,
} from "@/components/account/PendingPaymentAlert";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const [orders, verificationOrders] = await Promise.all([
    getPayableOrders(session.user.id),
    getPendingVerificationOrders(session.user.id),
  ]);
  const summary: PaymentSummary = {
    ...summarizePayable(orders),
    orders,
    verificationOrders,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/40 via-white to-gray-50">
      {summary.totalDuePaise > 0 && (
        <>
          <PendingPaymentAlert summary={summary} />
          <PendingPaymentPopup summary={summary} />
        </>
      )}
      {children}
    </div>
  );
}
