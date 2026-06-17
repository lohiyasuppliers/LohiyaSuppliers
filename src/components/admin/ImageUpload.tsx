"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        newUrls.push(url);
      }
    }

    onChange([...images, ...newUrls]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 block">Product Photos</label>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url} className="relative w-24 h-24 rounded-lg border overflow-hidden group">
            <Image src={url} alt={`Product ${i + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand-500 hover:text-brand-500 transition-colors"
        >
          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          <span className="text-xs mt-1">{uploading ? "..." : "Upload"}</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
      <p className="text-xs text-gray-500">JPEG, PNG, WebP up to 5MB. First image is the main product photo.</p>
    </div>
  );
}
