import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";
import { revalidateCategories } from "@/lib/revalidate-catalog";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const body = await req.json();
  const slug = body.slug || slugify(body.name);
  const category = await prisma.category.create({
    data: {
      name: body.name,
      slug,
      description: body.description ?? null,
      type: body.type,
      application: body.application,
      parentId: body.parentId ?? null,
      imageUrl: body.imageUrl ?? null,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
    },
  });
  revalidateCategories();
  return NextResponse.json(category);
}
