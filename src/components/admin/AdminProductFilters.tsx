"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function AdminProductFilters({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  function applyFilters(category?: string) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const cat = category ?? searchParams.get("category") ?? "";
    if (cat) params.set("category", cat);
    router.push(`/admin/products?${params.toString()}`);
  }

  return (
    <div className="p-4 border-b flex items-center gap-4">
      <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }} className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
        />
      </form>
      <select
        value={searchParams.get("category") || ""}
        onChange={(e) => applyFilters(e.target.value)}
        className="px-3 py-2 border rounded-lg text-sm"
      >
        <option value="">All Categories</option>
        {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
      </select>
    </div>
  );
}
