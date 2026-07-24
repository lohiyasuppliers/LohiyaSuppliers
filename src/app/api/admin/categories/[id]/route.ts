import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { revalidateCategories, revalidateProductCatalog } from "@/lib/revalidate-catalog";
import { deleteCategoryCascade } from "@/lib/delete-category";

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

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true, slug: true, name: true },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    if (category.slug === "archived") {
      return NextResponse.json(
        { error: "The Archived category cannot be deleted — it holds products from order history." },
        { status: 400 }
      );
    }

    const result = await deleteCategoryCascade(id);
    revalidateCategories();
    revalidateProductCatalog();
    return NextResponse.json(result);
  } catch (error) {
    console.error("delete category failed", error);
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
