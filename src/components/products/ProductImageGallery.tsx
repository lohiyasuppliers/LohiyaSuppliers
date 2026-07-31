"use client";

import { useState } from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { CATALOG_IMAGES } from "@/lib/catalog-images";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  brand?: string | null;
  variantBadge?: string;
}

export function ProductImageGallery({
  images,
  productName,
  brand,
  variantBadge,
}: ProductImageGalleryProps) {
  const gallery = images.length > 0 ? images : [CATALOG_IMAGES.productDefault];
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeSrc = gallery[activeIndex] ?? gallery[0];

  return (
    <div className="space-y-3">
      <div className="aspect-square bg-gradient-to-br from-gray-50 to-brand-50/40 rounded-2xl border border-gray-100 relative overflow-hidden shadow-xl shadow-brand-900/5">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 z-[1] cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl"
          aria-label={`View full image of ${productName}`}
        >
          <OptimizedImage
            src={activeSrc}
            alt={productName}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="hover:scale-[1.02] transition-transform duration-700 object-contain pointer-events-none"
          />
        </button>
        {brand && (
          <span className="absolute top-4 left-4 z-10 px-4 py-1.5 bg-white/95 backdrop-blur text-sm font-bold text-brand-800 rounded-xl shadow-md pointer-events-none">
            {brand}
          </span>
        )}
        {variantBadge && (
          <span className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-md pointer-events-none">
            {variantBadge}
          </span>
        )}
        <span className="absolute bottom-3 right-3 z-10 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-medium text-white pointer-events-none">
          Click to enlarge
        </span>
      </div>

      {gallery.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {gallery.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 bg-gray-50 transition-all ${
                i === activeIndex
                  ? "border-brand-600 ring-2 ring-brand-200"
                  : "border-gray-200 hover:border-brand-300"
              }`}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === activeIndex ? "true" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${productName} — photo ${i + 1}`}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}

      <ImageLightbox
        src={activeSrc}
        alt={productName}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
