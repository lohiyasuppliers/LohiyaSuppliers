import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { apiError, parseJsonBody } from "@/lib/api";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(banners);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const body = await parseJsonBody<{
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    linkUrl?: string;
    link?: string;
    sortOrder?: number;
    isActive?: boolean;
  }>(req);

  const title = String(body?.title || "").trim();
  const imageUrl = String(body?.imageUrl || "").trim();
  if (!title) return apiError("Title is required");
  if (!imageUrl) return apiError("Image URL is required");

  const banner = await prisma.banner.create({
    data: {
      title,
      subtitle: body?.subtitle ? String(body.subtitle).trim() : null,
      imageUrl,
      linkUrl: String(body?.linkUrl || body?.link || "").trim() || null,
      sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body?.sortOrder) : 0,
      isActive: body?.isActive ?? true,
    },
  });

  return NextResponse.json(banner, { status: 201 });
}
