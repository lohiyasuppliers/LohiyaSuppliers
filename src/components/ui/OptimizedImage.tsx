"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATALOG_IMAGES, normalizeImageUrl } from "@/lib/catalog-images";

interface OptimizedImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
  fallbackLabel?: string;
}

export function OptimizedImage({
  src,
  alt,
  priority = false,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  fallbackLabel,
}: OptimizedImageProps) {
  const resolved = normalizeImageUrl(src);
  const [activeSrc, setActiveSrc] = useState(resolved);
  const [failed, setFailed] = useState(false);

  if (!activeSrc?.trim() || failed) {
    return (
      <div className="relative w-full h-full min-h-[4rem] bg-gradient-to-br from-brand-50 via-white to-brand-100 flex flex-col items-center justify-center gap-2 p-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-brand-500" />
        </div>
        {fallbackLabel && (
          <span className="text-xs font-medium text-brand-700 text-center line-clamp-2">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  const isLocal = activeSrc.startsWith("/");

  return (
    <div className="relative w-full h-full min-h-[1px]">
      <Image
        src={activeSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isLocal}
        onError={() => {
          if (activeSrc !== CATALOG_IMAGES.productDefault) {
            setActiveSrc(CATALOG_IMAGES.productDefault);
          } else {
            setFailed(true);
          }
        }}
        className={cn("object-cover", className)}
      />
    </div>
  );
}
