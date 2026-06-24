"use client";

import { useInView } from "@/hooks/useInView";
import { useScrollParallax } from "@/hooks/useScrollParallax";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { cn } from "@/lib/utils";

type ImageVariant = "hero" | "card" | "team" | "offer";

interface AboutAnimatedImageProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  fallbackLabel?: string;
  className?: string;
  imageClassName?: string;
  variant?: ImageVariant;
  revealDelay?: number;
  showCorners?: boolean;
  showScan?: boolean;
}

export function AboutAnimatedImage({
  src,
  alt,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  fallbackLabel,
  className,
  imageClassName,
  variant = "card",
  revealDelay = 0,
  showCorners = true,
  showScan = false,
}: AboutAnimatedImageProps) {
  const { ref: viewRef, inView } = useInView(0.12);
  const { ref: parallaxRef, offset } = useScrollParallax(variant === "hero" ? 18 : 28);

  const setRef = (node: HTMLDivElement | null) => {
    (viewRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    (parallaxRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <div
      ref={setRef}
      className={cn(
        "about-img-frame group relative w-full h-full overflow-hidden",
        variant === "team" && "about-img-team",
        className
      )}
    >
      <div
        className={cn("about-img-reveal absolute inset-0", inView && "about-img-reveal-active")}
        style={{ transitionDelay: `${revealDelay}ms` }}
      >
        <div
          className="about-img-parallax absolute inset-[-10%]"
          style={{ transform: `translate3d(0, ${offset}px, 0)` }}
        >
          <div
            className={cn(
              "about-img-inner absolute inset-0",
              inView && variant === "hero" && "about-img-ken",
              inView && variant !== "hero" && "about-img-drift"
            )}
          >
            <OptimizedImage
              src={src}
              alt={alt}
              sizes={sizes}
              priority={priority}
              fallbackLabel={fallbackLabel}
              className={cn("object-cover", imageClassName)}
            />
          </div>
        </div>

        <div className="about-img-shine pointer-events-none" aria-hidden />
        <div className="about-img-vignette pointer-events-none" aria-hidden />

        {showScan && inView && <div className="about-img-scan pointer-events-none" aria-hidden />}
      </div>

      {showCorners && (
        <>
          <span
            className={cn("about-img-corner about-img-corner-tl", inView && "about-img-corner-visible")}
            aria-hidden
          />
          <span
            className={cn("about-img-corner about-img-corner-br", inView && "about-img-corner-visible")}
            aria-hidden
          />
        </>
      )}
    </div>
  );
}
