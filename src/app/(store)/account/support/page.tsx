"use client";

import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { SupportChat } from "@/components/support/SupportChat";
import { MessageCircle } from "lucide-react";

export default function ClientSupportPage() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function boot() {
      setBooting(true);
      setError("");
      try {
        const listRes = await fetch("/api/support/threads");
        const list = await listRes.json().catch(() => []);
        if (!listRes.ok) {
          setError(list?.error || "Failed to load support");
          return;
        }
        if (Array.isArray(list) && list.length > 0) {
          setThreadId(list[0].id);
          return;
        }
        const createRes = await fetch("/api/support/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: "Support" }),
        });
        const created = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          setError(created.error || "Failed to start chat");
          return;
        }
        setThreadId(created.id);
      } finally {
        setBooting(false);
      }
    }
    boot();
  }, []);

  return (
    <AccountShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-brand-600" />
            Support
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Chat with our team — send text, images, PDFs, audio, or video (up to 15MB).
          </p>
        </div>
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {booting ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-sm text-gray-500">
            Opening chat…
          </div>
        ) : (
          <SupportChat mode="client" threadId={threadId} />
        )}
      </div>
    </AccountShell>
  );
}
