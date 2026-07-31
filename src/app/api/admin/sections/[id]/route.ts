import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await req.json();

  const section = await prisma.pageSection.update({
    where: { id },
    data: {
      title: body.title,
      subtitle: body.subtitle || null,
      content: body.content,
      isActive: body.isActive,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
    },
  });

  return NextResponse.json(section);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  await prisma.pageSection.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
