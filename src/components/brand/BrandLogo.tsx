import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo.png";

interface BrandLogoProps {
  /** Full horizontal lockup vs cropped icon (sidebar / compact). */
  variant?: "full" | "icon";
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  href?: string;
}

export function BrandLogo({
  variant = "full",
  className,
  imageClassName,
  priority = false,
  href,
}: BrandLogoProps) {
  const image =
    variant === "icon" ? (
      <Image
        src={LOGO_SRC}
        alt="Lohiya Suppliers"
        width={40}
        height={40}
        priority={priority}
        unoptimized
        className={cn("h-10 w-10 object-cover object-left rounded-lg shrink-0", imageClassName)}
      />
    ) : (
      <Image
        src={LOGO_SRC}
        alt="Lohiya Suppliers"
        width={240}
        height={64}
        priority={priority}
        unoptimized
        className={cn("h-10 sm:h-12 w-auto object-contain", imageClassName)}
      />
    );

  const wrapped = href ? (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      {image}
    </Link>
  ) : (
    <span className={cn("inline-flex items-center", className)}>{image}</span>
  );

  return wrapped;
}
