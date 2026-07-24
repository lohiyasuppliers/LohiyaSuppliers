import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { revalidateCategories } from "@/lib/revalidate-catalog";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;
  const body = await req.json();
  const category = await prisma.category.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.slug,
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

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "Category has products. Move or delete them first." },
      { status: 400 }
    );
  }
  const childCount = await prisma.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    return NextResponse.json(
      { error: "Category has subcategories. Delete them first." },
      { status: 400 }
    );
  }
  await prisma.category.delete({ where: { id } });
  revalidateCategories();
  return NextResponse.json({ success: true });
}
