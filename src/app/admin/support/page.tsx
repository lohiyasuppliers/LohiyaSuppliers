"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SupportChat } from "@/components/support/SupportChat";
import { MessageCircle } from "lucide-react";

type Thread = {
  id: string;
  subject: string;
  lastMessageAt: string;
  client: {
    name: string | null;
    email: string;
    clientProfile: { company: string } | null;
  };
  messages: { body: string; createdAt: string }[];
  _count: { messages: number };
};

function AdminSupportInner() {
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("thread"));
  const [loading, setLoading] = useState(true);

  async function loadThreads() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/support/threads");
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) {
        setThreads(data);
        if (!selectedId && data.length > 0) setSelectedId(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadThreads();
    const t = setInterval(loadThreads, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("thread");
    if (fromUrl) setSelectedId(fromUrl);
  }, [searchParams]);

  const selected = threads.find((t) => t.id === selectedId);

  return (
    <div className="space-y-6 admin-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-brand-600" />
          Support
        </h1>
        <p className="text-sm text-gray-500">Client conversations</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden max-h-[560px] overflow-y-auto">
          {loading && threads.length === 0 && (
            <p className="p-4 text-sm text-gray-500">Loading threads…</p>
          )}
          {!loading && threads.length === 0 && (
            <p className="p-4 text-sm text-gray-500">No support threads yet.</p>
          )}
          {threads.map((t) => {
            const active = t.id === selectedId;
            const preview = t.messages[0]?.body || "No messages yet";
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left border-b border-gray-50 px-4 py-3 transition-colors ${
                  active ? "bg-brand-50" : "hover:bg-gray-50"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {t.client.clientProfile?.company || t.client.name || t.client.email}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{preview}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(t.lastMessageAt).toLocaleString("en-IN")} · {t._count.messages} msgs
                </p>
              </button>
            );
          })}
        </div>

        <div>
          {selected && (
            <div className="mb-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">
                {selected.client.clientProfile?.company || selected.client.name}
              </p>
              <p className="text-xs text-gray-500">{selected.client.email}</p>
            </div>
          )}
          <SupportChat
            mode="admin"
            threadId={selectedId}
            emptyHint="Select a client thread to reply"
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading support…</div>}>
      <AdminSupportInner />
    </Suspense>
  );
}
