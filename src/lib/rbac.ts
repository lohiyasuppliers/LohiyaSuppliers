import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { authOptions } from "./auth";
import type { AppRole } from "./constants";

export function isAdmin(role: string | undefined): role is "ADMIN" {
  return role === "ADMIN";
}

export function isClient(role: string | undefined): role is "CLIENT" {
  return role === "CLIENT";
}

export function hasRole(role: string | undefined, allowed: AppRole[]): boolean {
  return !!role && allowed.includes(role as AppRole);
}

/** Ensures the authenticated user is the same client or an admin. */
export function canAccessClientResource(
  session: Session,
  clientId: string
): boolean {
  if (isAdmin(session.user.role)) return true;
  return isClient(session.user.role) && session.user.id === clientId;
}

export async function requireAuthApi() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { authorized: true as const, session };
}

export async function requireAdminApi() {
  const auth = await requireAuthApi();
  if (!auth.authorized) return auth;
  if (!isAdmin(auth.session.user.role)) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return auth;
}

export async function requireClientApi() {
  const auth = await requireAuthApi();
  if (!auth.authorized) return auth;
  if (!isClient(auth.session.user.role)) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return auth;
}

/** Client-only route: returns 403 if admin tries to access client-private resources. */
export async function requireSelfClientApi(expectedClientId: string) {
  const auth = await requireAuthApi();
  if (!auth.authorized) return auth;
  if (!canAccessClientResource(auth.session, expectedClientId)) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return auth;
}
