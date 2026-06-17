"use client";

import { AdminSearch } from "@/components/admin/AdminSearch";
import { signOut, useSession } from "next-auth/react";
import { LogOut, ExternalLink } from "lucide-react";
import Link from "next/link";

export function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <AdminSearch />
      <div className="flex items-center gap-4 ml-4">
        <Link
          href="/"
          target="_blank"
          className="text-sm text-gray-500 hover:text-brand-600 hidden sm:inline-flex items-center gap-1"
        >
          View Store <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {session?.user?.name?.[0] || "A"}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-900">{session?.user?.name}</div>
            <div className="text-xs text-brand-600 font-medium">Administrator</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
