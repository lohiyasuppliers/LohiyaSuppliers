"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

export function ClientCredentialsPanel({
  userId,
  email,
  phone,
}: {
  userId: string;
  email: string;
  phone?: string | null;
}) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function savePassword() {
    if (password.length < 6) {
      setMessage({ type: "err", text: "Password must be at least 6 characters" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "Failed to update password" });
        return;
      }
      setMessage({ type: "ok", text: "Password updated. Share the new password with the client securely." });
      setPassword("");
      setShow(false);
    } finally {
      setLoading(false);
    }
  }

  function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setPassword(out);
    setShow(true);
    setMessage(null);
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <KeyRound className="w-4 h-4 text-brand-600" />
        Login credentials
      </div>
      <p className="text-xs text-slate-500">
        Passwords are encrypted — you cannot view the current password, only set a new one.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border bg-white px-3 py-2">
          <div className="text-xs text-slate-500">Login email (ID)</div>
          <div className="font-mono font-medium text-slate-900 mt-0.5">{email}</div>
        </div>
        <div className="rounded-lg border bg-white px-3 py-2">
          <div className="text-xs text-slate-500">Contact phone</div>
          <div className="font-medium text-slate-900 mt-0.5">{phone || "—"}</div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600 block mb-1">Set new password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={generatePassword}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50"
        >
          Generate
        </button>
        <button
          type="button"
          disabled={loading || !password}
          onClick={savePassword}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save password
        </button>
      </div>
      {message && (
        <p
          className={`text-sm ${message.type === "ok" ? "text-emerald-700" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
