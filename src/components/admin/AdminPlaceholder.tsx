import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

interface AdminPlaceholderProps {
  title: string;
  description: string;
  links?: { href: string; label: string }[];
}

export function AdminPlaceholder({ title, description, links = [] }: AdminPlaceholderProps) {
  return (
    <div className="admin-fade-in mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Construction className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 text-slate-500 leading-relaxed">{description}</p>
        {links.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
