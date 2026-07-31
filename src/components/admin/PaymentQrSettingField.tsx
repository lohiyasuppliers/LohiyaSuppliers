"use client";

import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { normalizeImageUrl } from "@/lib/catalog-images";

interface PaymentQrSettingFieldProps {
  value: string;
  onChange: (url: string) => void;
}

export function PaymentQrSettingField({ value, onChange }: PaymentQrSettingFieldProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSrc = value?.trim() ? normalizeImageUrl(value) : "";

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        onChange(data.url);
      } else {
        alert(data.error || "Failed to upload QR image");
      }
    } catch {
      alert("Failed to upload QR image");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/30 p-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Payment QR Image
        </label>
        <p className="text-xs text-gray-500">
          Upload a QR code image or paste a URL. Shown to clients during UPI payment.
        </p>
      </div>

      {previewSrc && (
        <div className="flex justify-center rounded-xl border border-gray-200 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt="Payment QR preview"
            className="h-48 w-48 max-w-full object-contain"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Uploading…" : "Upload QR Image"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleUpload}
      />

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Or paste image URL
        </label>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/api/media/… or https://…"
          className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
        />
      </div>
    </div>
  );
}
