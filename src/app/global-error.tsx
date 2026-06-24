"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Lohiya Suppliers</h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Something went wrong loading the site.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            background: "#0069c6",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginRight: "0.5rem",
          }}
        >
          Try again
        </button>
        <Link href="/" style={{ color: "#0069c6" }}>
          Go home
        </Link>
        {process.env.NODE_ENV === "development" && (
          <pre
            style={{
              marginTop: "1.5rem",
              textAlign: "left",
              fontSize: "12px",
              color: "#c00",
              whiteSpace: "pre-wrap",
            }}
          >
            {error.message}
          </pre>
        )}
      </body>
    </html>
  );
}
