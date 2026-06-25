import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { Role } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;
  const data = await req.json();

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role === Role.ADMIN) {
    return NextResponse.json({ error: "Admin accounts cannot be suspended" }, { status: 400 });
  }
  if (auth.session.user.id === id && data.isActive === false) {
    return NextResponse.json({ error: "Cannot suspend your own account" }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, isActive: user.isActive, role: user.role });
}
