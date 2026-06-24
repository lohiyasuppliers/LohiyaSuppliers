"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Gift,
  Lock,
  Smartphone,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { formatPaise, formatDate, paiseToRupees } from "@/lib/utils";

interface WalletEntry {
  id: string;
  amountPaise: number;
  status: string;
  expiresAt: string;
  earnedAt: string;
  order?: { orderNumber: string } | null;
}

interface LedgerEntry {
  id: string;
  type: string;
  amountPaise: number;
  description: string;
  createdAt: string;
}

interface Redemption {
  id: string;
  type: string;
  amountPaise: number;
  status: string;
  upiId: string | null;
  clientNote: string | null;
  adminComment: string | null;
  paymentProof: string | null;
  rejectionReason: string | null;
  amazonCode: string | null;
  createdAt: string;
  fulfilledAt: string | null;
}

export interface CashbackWalletInitial {
  availablePaise: number;
  lockedPaise: number;
  balancePaise: number;
  wallet: WalletEntry[];
  ledger: LedgerEntry[];
  redemptions: Redemption[];
}

export function CashbackWalletClient({ initial }: { initial: CashbackWalletInitial }) {
  const { status } = useSession();
  const [available, setAvailable] = useState(initial.availablePaise);
  const [locked, setLocked] = useState(initial.lockedPaise);
  const [wallet, setWallet] = useState<WalletEntry[]>(initial.wallet);
  const [ledger, setLedger] = useState<LedgerEntry[]>(initial.ledger);
  const [redemptions, setRedemptions] = useState<Redemption[]>(initial.redemptions);
  const [loading, setLoading] = useState(false);
  const [redeemRupees, setRedeemRupees] = useState("");
  const [upiId, setUpiId] = useState("");
  const [redeemType, setRedeemType] = useState<"UPI" | "AMAZON_VOUCHER" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const maxRedeemRupees = paiseToRupees(available);

  function applyData(data: CashbackWalletInitial) {
    setAvailable(data.availablePaise ?? 0);
    setLocked(data.lockedPaise ?? 0);
    setWallet(data.wallet ?? []);
    setLedger(data.ledger ?? []);
    setRedemptions(data.redemptions ?? []);
  }

  function load() {
    setLoading(true);
    setError("");
    fetch("/api/user/cashback", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load wallet");
        applyData(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load wallet"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status]);

  async function submitRedemption() {
    if (!redeemType) return;
    if (redeemType === "UPI" && !upiId.trim()) {
      setMessage("Please enter your UPI ID");
      return;
    }
    const amount = Number(redeemRupees);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Enter a valid amount");
      return;
    }
    if (amount > maxRedeemRupees) {
      setMessage(`Maximum available: ₹${maxRedeemRupees.toLocaleString("en-IN")}`);
      return;
    }

    setSubmitting(true);
    setMessage("");
    const res = await fetch("/api/user/cashback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountRupees: redeemRupees,
        type: redeemType,
        upiId: redeemType === "UPI" ? upiId.trim() : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setRedeemRupees("");
      setUpiId("");
      setRedeemType(null);
      load();
    } else {
      setMessage(data.error || "Redemption failed");
    }
    setSubmitting(false);
  }

  const statusBadge = (s: string) => {
    if (s === "FULFILLED")
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Paid
        </span>
      );
    if (s === "PENDING")
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" /> Awaiting admin
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  };

  return (
    <AccountShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-7 h-7 text-amber-600" />
            Cashback Wallet
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Earn cashback on orders. Use it on your next bill, redeem to UPI, or request a gift card.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Available</p>
            <p className="text-3xl font-black text-amber-900 mt-1">
              {loading ? "…" : formatPaise(available)}
            </p>
            <p className="text-xs text-amber-600 mt-2">Ready to use or redeem</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </p>
            <p className="text-3xl font-black text-gray-800 mt-1">
              {loading ? "…" : formatPaise(locked)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Unlocks when linked orders are fully paid</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Redeem cashback</h2>
          <p className="text-sm text-gray-500">
            At checkout, tick &quot;Use cashback wallet&quot; to apply on your next order. Or redeem
            below — UPI requires your UPI ID; admin approves and shares payment proof.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRedeemType(redeemType === "UPI" ? null : "UPI")}
              disabled={available <= 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 ${
                redeemType === "UPI"
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-gray-200 hover:border-brand-300"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Redeem to UPI
            </button>
            <button
              type="button"
              onClick={() =>
                setRedeemType(redeemType === "AMAZON_VOUCHER" ? null : "AMAZON_VOUCHER")
              }
              disabled={available <= 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 ${
                redeemType === "AMAZON_VOUCHER"
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-gray-200 hover:border-brand-300"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Amazon gift card
            </button>
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-medium"
            >
              Use on next order →
            </Link>
          </div>

          {redeemType && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
              <p className="text-xs text-amber-700 font-medium">
                Max redeemable: ₹{maxRedeemRupees.toLocaleString("en-IN")}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max={maxRedeemRupees}
                  step="0.01"
                  value={redeemRupees}
                  onChange={(e) => setRedeemRupees(e.target.value)}
                  placeholder={maxRedeemRupees > 0 ? String(maxRedeemRupees) : "0"}
                  className="w-full max-w-xs px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              {redeemType === "UPI" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your UPI ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@upi"
                    className="w-full max-w-md px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={submitRedemption}
                disabled={submitting || available <= 0}
                className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit for admin approval"}
              </button>
            </div>
          )}

          {message && (
            <p className="text-sm text-gray-700 bg-gray-100 rounded-lg px-4 py-3">{message}</p>
          )}
        </div>

        {redemptions.length > 0 && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <h2 className="font-bold text-gray-900 px-6 py-4 border-b">Redemption requests</h2>
            <div className="divide-y">
              {redemptions.map((r) => (
                <div key={r.id} className="px-6 py-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {formatPaise(r.amountPaise)} —{" "}
                        {r.type === "UPI" ? "UPI transfer" : "Gift card"}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(r.createdAt)}</p>
                    </div>
                    {statusBadge(r.status)}
                  </div>
                  {r.upiId && (
                    <p className="text-sm text-gray-600">
                      UPI: <span className="font-mono">{r.upiId}</span>
                    </p>
                  )}
                  {r.status === "FULFILLED" && r.paymentProof && (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                      <p className="text-xs font-semibold text-emerald-800 mb-2">
                        Admin payment proof
                      </p>
                      {r.paymentProof.startsWith("data:image") ||
                      r.paymentProof.startsWith("http") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.paymentProof}
                          alt="Payment proof"
                          className="max-h-40 rounded-lg border"
                        />
                      ) : (
                        <p className="text-sm text-emerald-900">{r.paymentProof}</p>
                      )}
                      {r.adminComment && (
                        <p className="text-xs text-emerald-700 mt-2">{r.adminComment}</p>
                      )}
                    </div>
                  )}
                  {r.status === "FULFILLED" && r.amazonCode && (
                    <p className="text-sm font-mono bg-gray-100 px-3 py-2 rounded-lg">
                      Gift code: {r.amazonCode}
                    </p>
                  )}
                  {r.status === "CANCELLED" && r.rejectionReason && (
                    <p className="text-sm text-red-600">Reason: {r.rejectionReason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border overflow-hidden">
            <h2 className="font-bold text-gray-900 px-6 py-4 border-b">Wallet entries</h2>
            {wallet.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-500">No cashback yet.</p>
            ) : (
              <ul className="divide-y max-h-80 overflow-y-auto">
                {wallet.map((w) => (
                  <li key={w.id} className="px-6 py-3 flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{formatPaise(w.amountPaise)}</p>
                      <p className="text-xs text-gray-500">
                        {w.order?.orderNumber ? `Order ${w.order.orderNumber}` : "Admin credit"} ·{" "}
                        expires {formatDate(w.expiresAt)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        w.status === "AVAILABLE"
                          ? "bg-emerald-50 text-emerald-700"
                          : w.status === "LOCKED"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {w.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border overflow-hidden">
            <h2 className="font-bold text-gray-900 px-6 py-4 border-b">Activity</h2>
            {ledger.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-500">No activity yet.</p>
            ) : (
              <ul className="divide-y max-h-80 overflow-y-auto">
                {ledger.map((l) => (
                  <li key={l.id} className="px-6 py-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">{l.description}</span>
                      <span
                        className={
                          l.type === "EARNED" ? "text-emerald-600 font-medium" : "text-amber-700"
                        }
                      >
                        {l.type === "EARNED" ? "+" : "−"}
                        {formatPaise(l.amountPaise)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(l.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AccountShell>
  );
}
