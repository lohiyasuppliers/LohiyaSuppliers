import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "./rate-limit";

export function rateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Too many requests. Please wait and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

/** Rate-limit sensitive auth/public endpoints by IP. */
export function enforceAuthRateLimit(
  req: Request,
  action: "forgot" | "reset" | "register" | "login"
) {
  const ip = getClientIp(req.headers);
  const limits = {
    forgot: { limit: 5, windowMs: 15 * 60 * 1000 },
    reset: { limit: 10, windowMs: 15 * 60 * 1000 },
    register: { limit: 5, windowMs: 60 * 60 * 1000 },
    login: { limit: 20, windowMs: 15 * 60 * 1000 },
  } as const;

  const result = rateLimit(`auth:${action}:${ip}`, limits[action]);
  if (!result.ok) {
    return rateLimitResponse(result.retryAfterSec);
  }
  return null;
}
