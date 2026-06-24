"use client";

import { useEffect, useState } from "react";
import { Wallet, X, Gift, Lock, Smartphone, CreditCard } from "lucide-react";
import { formatPaise, formatDate } from "@/lib/utils";

interface LedgerEntry {
  id: string;
  type: string;
  amountPaise: number;
  description: string;
  createdAt: string;
}

interface WalletEntry {
  id: string;
  amountPaise: number;
  status: string;
  expiresAt: string;
  order?: { orderNumber: string } | null;
}

export function CashbackPopup() {
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(0);
  const [locked, setLocked] = useState(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [wallet, setWallet] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [redeemRupees, setRedeemRupees] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/user/cashback")
      .then((r) => r.json())
      .then((data) => {
        setAvailable(data.availablePaise ?? data.balancePaise ?? 0);
        setLocked(data.lockedPaise ?? 0);
        setLedger(data.ledger ?? []);
        setWallet(data.wallet ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!open) return;
    load();
  }, [open]);

  async function redeem(type: "UPI" | "AMAZON_VOUCHER") {
    setRedeeming(true);
    const res = await fetch("/api/user/cashback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountRupees: redeemRupees, type }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      setRedeemRupees("");
      load();
    } else {
      alert(data.error || "Failed");
    }
    setRedeeming(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2.5 mt-2 rounded-lg text-sm font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
      >
        <Gift className="w-4 h-4" />
        Cashback Wallet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-amber-50 to-brand-50 sticky top-0">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900">Cashback Wallet</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/80">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-xs text-amber-700">Available</p>
                  <p className="text-xl font-bold text-amber-900">
                    {loading ? "…" : formatPaise(available)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gray-50 border">
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </p>
                  <p className="text-xl font-bold text-gray-700">
                    {loading ? "…" : formatPaise(locked)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Cashback expires 30 days after earned (locked or unlocked). Use available balance on
                your next order at checkout, or redeem below.
              </p>

              {available > 0 && (
                <div className="rounded-xl border p-4 space-y-3">
                  <p className="text-sm font-semibold">Redeem cashback</p>
                  <input
                    type="number"
                    value={redeemRupees}
                    onChange={(e) => setRedeemRupees(e.target.value)}
                    placeholder="Amount ₹"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={redeeming}
                      onClick={() => redeem("UPI")}
                      className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-brand-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> UPI
                    </button>
                    <button
                      type="button"
                      disabled={redeeming}
                      onClick={() => redeem("AMAZON_VOUCHER")}
                      className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 px-3 py-2 border border-amber-300 text-amber-800 rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Gift card
                    </button>
                  </div>
                </div>
              )}

              {wallet.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-gray-700">Your entries</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {wallet.slice(0, 8).map((e) => (
                      <div key={e.id} className="flex justify-between p-2 bg-gray-50 rounded-lg text-xs">
                        <span>
                          {formatPaise(e.amountPaise)} · {e.status}
                          {e.order?.orderNumber ? ` · ${e.order.orderNumber}` : ""}
                        </span>
                        <span className="text-gray-400">{formatDate(e.expiresAt)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h4 className="text-sm font-semibold text-gray-700">Recent Activity</h4>
              {loading ? (
                <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
              ) : ledger.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No activity yet.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {ledger.map((entry) => (
                    <div key={entry.id} className="flex justify-between p-3 bg-gray-50 rounded-lg text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{entry.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(entry.createdAt)}</p>
                      </div>
                      <span
                        className={`font-semibold ${
                          entry.type === "EARNED" ? "text-emerald-600" : "text-gray-600"
                        }`}
                      >
                        {entry.type === "EARNED" ? "+" : "−"}
                        {formatPaise(entry.amountPaise)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
