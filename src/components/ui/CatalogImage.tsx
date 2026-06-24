import Image from "next/image";
import { cn } from "@/lib/utils";
import { CATALOG_IMAGES, normalizeImageUrl } from "@/lib/catalog-images";

interface CatalogImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

/** Server-friendly image — no client hydration (local SVG/PNG assets). */
export function CatalogImage({
  src,
  alt,
  priority = false,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: CatalogImageProps) {
  const resolved = normalizeImageUrl(src) || CATALOG_IMAGES.productDefault;

  return (
    <div className="relative w-full h-full min-h-[1px]">
      <Image
        src={resolved}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={resolved.startsWith("/")}
        className={cn("object-cover", className)}
      />
    </div>
  );
}
