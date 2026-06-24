"use client";

import Link from "next/link";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center bg-white rounded-2xl border p-8 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6">
          The page hit an error. Try again or return to the homepage.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Go home
          </Link>
        </div>
        {process.env.NODE_ENV === "development" && (
          <p className="mt-4 text-xs text-red-600 break-all">{error.message}</p>
        )}
      </div>
    </div>
  );
}
