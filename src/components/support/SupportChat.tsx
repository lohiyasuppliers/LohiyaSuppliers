"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";

type Attachment = { url: string; name: string; type: string; size: number };

type Message = {
  id: string;
  body: string;
  senderRole: "ADMIN" | "CLIENT";
  attachments: string;
  createdAt: string;
};

function parseAttachments(raw: string): Attachment[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface SupportChatProps {
  mode: "client" | "admin";
  threadId: string | null;
  emptyHint?: string;
}

export function SupportChat({ mode, threadId, emptyHint }: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const messagesUrl =
    mode === "admin"
      ? `/api/admin/support/threads/${threadId}/messages`
      : `/api/support/threads/${threadId}/messages`;
  const uploadUrl = mode === "admin" ? "/api/admin/support/upload" : "/api/support/upload";

  const load = useCallback(async () => {
    if (!threadId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(messagesUrl);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to load messages");
        return;
      }
      setMessages(data.messages || []);
    } finally {
      setLoading(false);
    }
  }, [messagesUrl, threadId]);

  useEffect(() => {
    load();
    if (!threadId) return;
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load, threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(uploadUrl, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data as Attachment;
  }

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    try {
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadFile(file));
      }
      setPendingFiles((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function send() {
    if (!threadId) return;
    const body = text.trim();
    if (!body && pendingFiles.length === 0) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(messagesUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, attachments: pendingFiles }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to send");
        return;
      }
      setText("");
      setPendingFiles([]);
      await load();
    } finally {
      setSending(false);
    }
  }

  if (!threadId) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-2xl border border-gray-100 bg-white text-sm text-gray-500">
        {emptyHint || "Select a conversation"}
      </div>
    );
  }

  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gradient-to-r from-brand-50 to-white px-4 py-3">
        <p className="text-sm font-semibold text-gray-900">Support chat</p>
        <p className="text-xs text-gray-500">Messages sync every few seconds</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[#eef5f1] p-4">
        {loading && messages.length === 0 && (
          <p className="text-center text-sm text-gray-500">Loading…</p>
        )}
        {messages.map((m) => {
          const mine =
            (mode === "client" && m.senderRole === "CLIENT") ||
            (mode === "admin" && m.senderRole === "ADMIN");
          const attachments = parseAttachments(m.attachments);
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                  mine
                    ? "rounded-br-md bg-brand-600 text-white"
                    : "rounded-bl-md bg-white text-gray-900 border border-gray-100"
                }`}
              >
                {m.body && <p className="text-sm whitespace-pre-wrap">{m.body}</p>}
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {attachments.map((a) =>
                      a.type.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={a.url}
                          src={a.url}
                          alt={a.name}
                          className="max-h-48 rounded-lg object-cover"
                        />
                      ) : (
                        <a
                          key={a.url}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`block text-xs underline ${mine ? "text-brand-100" : "text-brand-700"}`}
                        >
                          {a.name}
                        </a>
                      )
                    )}
                  </div>
                )}
                <p className={`mt-1 text-[10px] ${mine ? "text-brand-100" : "text-gray-400"}`}>
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <div className="px-4 py-2 text-xs text-red-600 bg-red-50">{error}</div>}

      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 px-4 py-2">
          {pendingFiles.map((f) => (
            <span key={f.url} className="rounded-lg bg-brand-50 px-2 py-1 text-xs text-brand-800">
              {f.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-gray-100 p-3">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf,video/*,audio/*"
          multiple
          onChange={(e) => onPickFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-xl p-2.5 text-gray-500 hover:bg-gray-100"
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder="Type a message…"
          className="max-h-28 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </div>
    </div>
  );
}
