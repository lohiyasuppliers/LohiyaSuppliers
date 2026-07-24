import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { apiError, parseJsonBody } from "@/lib/api";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) return apiError("Banner not found", 404);

  const body = await parseJsonBody<{
    title?: string;
    subtitle?: string | null;
    imageUrl?: string;
    linkUrl?: string | null;
    link?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }>(req);

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      ...(body?.title !== undefined ? { title: String(body.title).trim() } : {}),
      ...(body?.subtitle !== undefined
        ? { subtitle: body.subtitle ? String(body.subtitle).trim() : null }
        : {}),
      ...(body?.imageUrl !== undefined ? { imageUrl: String(body.imageUrl).trim() } : {}),
      ...(body?.linkUrl !== undefined || body?.link !== undefined
        ? { linkUrl: String(body.linkUrl ?? body.link ?? "").trim() || null }
        : {}),
      ...(body?.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) || 0 } : {}),
      ...(body?.isActive !== undefined ? { isActive: !!body.isActive } : {}),
    },
  });

  return NextResponse.json(banner);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) return apiError("Banner not found", 404);

  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
