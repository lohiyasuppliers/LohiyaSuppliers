import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";
import { isAdmin, isClient } from "./rbac";
import { Role } from "@prisma/client";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (!isAdmin(session.user.role)) redirect("/");
  return session;
}

export async function requireClient() {
  const session = await requireAuth();
  if (!isClient(session.user.role)) redirect("/");
  return session;
}

export async function requireGuestOrClient() {
  const session = await getSession();
  if (session && isAdmin(session.user.role)) redirect("/admin");
  return session;
}

/** Logged-in B2B client id, or null for guests/admins. */
export async function getClientIdFromSession(): Promise<string | null> {
  const session = await getSession();
  if (session?.user?.role !== Role.CLIENT) return null;
  return (session.user as { id: string }).id;
}
