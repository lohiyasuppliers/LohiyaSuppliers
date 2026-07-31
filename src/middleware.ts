import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const BLOCKED_PATH_PREFIXES = [
  "/.env",
  "/.git",
  "/wp-admin",
  "/wp-login",
  "/phpmyadmin",
  "/xmlrpc.php",
];

function securityHeaders(res: NextResponse, isProd: boolean) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  if (isProd) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProd = process.env.NODE_ENV === "production";

  if (BLOCKED_PATH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return new NextResponse(null, { status: 404 });
  }

  if (pathname.includes("..") || pathname.includes("\\")) {
    return new NextResponse(null, { status: 400 });
  }

  const ip = getClientIp(req.headers);

  if (req.method === "POST" && pathname.startsWith("/api/auth/")) {
    let action: "login" | null = null;
    if (pathname.includes("callback/credentials")) action = "login";
    if (action) {
      const limited = rateLimit(`mw:auth:${action}:${ip}`, {
        limit: 20,
        windowMs: 15 * 60 * 1000,
      });
      if (!limited.ok) {
        return securityHeaders(
          NextResponse.json(
            { error: "Too many login attempts. Please try again later." },
            { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
          ),
          isProd
        );
      }
    }
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/api")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", pathname);
      return securityHeaders(NextResponse.redirect(login), isProd);
    }
    if (token.role !== "ADMIN") {
      return securityHeaders(NextResponse.redirect(new URL("/", req.url)), isProd);
    }
  }

  return securityHeaders(NextResponse.next(), isProd);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo\\.png|logo\\.svg|logos/|images/).*)",
  ],
};
