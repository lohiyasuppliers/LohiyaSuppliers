import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export function WhatsAppLink({
  phone,
  name,
  className,
  compact = false,
}: {
  phone?: string | null;
  name?: string | null;
  className?: string;
  compact?: boolean;
}) {
  if (!phone?.trim()) return null;

  const message = name
    ? `Hello ${name}, this is Lohiya Suppliers.`
    : "Hello, this is Lohiya Suppliers.";
  const href = buildWhatsAppUrl(phone, message);
  if (!href) return null;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors",
        compact
          ? "px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100"
          : "px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 shadow-sm",
        className
      )}
      title="Open WhatsApp"
    >
      <MessageCircle className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
      {compact ? "WhatsApp" : "Chat on WhatsApp"}
    </Link>
  );
}
