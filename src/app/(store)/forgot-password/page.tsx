"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setSent(true);
      router.push(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 motion-page-store">
      <div className="w-full max-w-md animate-pop-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            LS
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
          <p className="text-gray-500 mt-1">We&apos;ll email you a 6-digit reset code</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
          {sent && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-sm rounded-lg">
              If an account exists, a code was sent. Check your email.
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="you@company.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset code"}
          </button>
          <p className="text-center text-sm text-gray-500 mt-4">
            <Link href="/login" className="text-brand-600 font-medium hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
