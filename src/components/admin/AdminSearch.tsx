"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export function AdminSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (pathname.startsWith("/admin/products")) {
      setQuery(searchParams.get("search") || "");
    } else {
      setQuery("");
    }
  }, [pathname, searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();

    if (pathname.startsWith("/admin/products")) {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) params.set("search", trimmed);
      else params.delete("search");
      const q = params.toString();
      router.push(q ? `/admin/products?${q}` : "/admin/products");
      return;
    }

    if (!trimmed) return;
    router.push(`/admin/products?search=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-md flex-1 flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search orders, products, customers..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <button
        type="submit"
        className="shrink-0 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
      </button>
    </form>
  );
}
