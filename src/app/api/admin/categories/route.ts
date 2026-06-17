import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const body = await req.json();
  const slug = body.slug || slugify(body.name);
  const category = await prisma.category.create({
    data: { ...body, slug, sortOrder: body.sortOrder ?? 0 },
  });
  return NextResponse.json(category);
}
