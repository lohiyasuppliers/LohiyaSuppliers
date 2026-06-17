"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPaise, paiseToRupees } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { OrderType } from "@prisma/client";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { items, subtotalPaise, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderType, setOrderType] = useState<OrderType>(OrderType.PREPAID);
  const [notes, setNotes] = useState("");

  const taxPaise = items.reduce(
    (sum, i) => sum + Math.round((i.pricePaise * i.quantity * i.gstRateBps) / 10000),
    0
  );
  const totalPaise = subtotalPaise + taxPaise;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      router.push("/cart");
    }
  }, [items.length, orderPlaced, router]);

  if (status === "loading" || (items.length === 0 && !orderPlaced)) {
    return null;
  }

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Submitted</h1>
        <p className="text-gray-600 mb-2">
          Order Number: <strong>{orderNumber}</strong>
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Your order is pending admin approval. You will receive updates in your account dashboard.
        </p>
        <Link
          href="/account/orders"
          className="px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700"
        >
          View Orders
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variationId: i.variationId,
            quantity: i.quantity,
          })),
          orderType,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderNumber(data.orderNumber);
        clearCart();
        setOrderPlaced(true);
      } else {
        alert(data.error || "Failed to place order");
      }
    } catch {
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">B2B Checkout</h1>
      <p className="text-gray-500 text-sm mb-8">
        Ordering as {session?.user?.email}. Shipping & billing use your company profile.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold text-lg mb-4">Order Type</h2>
            <div className="space-y-2">
              {[
                { value: OrderType.PREPAID, label: "Prepaid", desc: "Pay before fulfillment" },
                { value: OrderType.POSTPAID, label: "Postpaid", desc: "Invoice after delivery" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="orderType"
                    value={opt.value}
                    checked={orderType === opt.value}
                    onChange={() => setOrderType(opt.value)}
                    className="mt-1 text-brand-600"
                  />
                  <span>
                    <span className="text-sm font-medium block">{opt.label}</span>
                    <span className="text-xs text-gray-500">{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold text-lg mb-4">Order Notes (optional)</h2>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="PO number, delivery instructions, etc."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 h-fit sticky top-24">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          {items.map((item) => (
            <div
              key={item.cartKey}
              className="flex justify-between text-sm py-2 border-b border-gray-50"
            >
              <span className="text-gray-600">
                {item.name}
                {item.variationLabel ? ` (${item.variationLabel})` : ""} × {item.quantity}
              </span>
              <span>{formatPaise(item.pricePaise * item.quantity)}</span>
            </div>
          ))}
          <div className="space-y-2 mt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatPaise(subtotalPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GST</span>
              <span>{formatPaise(taxPaise)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatPaise(totalPaise)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Approx. {formatPaise(Math.round(totalPaise))} (
            {paiseToRupees(totalPaise).toLocaleString("en-IN")} INR incl. GST)
          </p>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Order for Approval"}
          </button>
        </div>
      </form>
    </div>
  );
}
