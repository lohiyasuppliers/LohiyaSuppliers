import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;
  const data = await req.json();
  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, isActive: user.isActive, role: user.role });
}
