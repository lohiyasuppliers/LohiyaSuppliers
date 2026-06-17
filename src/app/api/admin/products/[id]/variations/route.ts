import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { rupeesToPaise } from "@/lib/money";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const variations = await prisma.productVariation.findMany({
    where: { productId: id },
    orderBy: { sku: "asc" },
  });
  return NextResponse.json(variations);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const { variations } = await req.json();

  if (!Array.isArray(variations)) {
    return NextResponse.json({ error: "Invalid variations" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const existing = await prisma.productVariation.findMany({ where: { productId: id } });
  const incomingIds = new Set(
    variations.filter((v: { id?: string }) => v.id).map((v: { id: string }) => v.id)
  );

  const toDelete = existing.filter((e) => !incomingIds.has(e.id));
  if (toDelete.length > 0) {
    await prisma.productVariation.deleteMany({
      where: { id: { in: toDelete.map((d) => d.id) } },
    });
  }

  for (const v of variations) {
    const data = {
      sku: v.sku,
      attributes: v.attributes || {},
      defaultPricePaise: v.priceRupees != null && v.priceRupees !== ""
        ? rupeesToPaise(Number(v.priceRupees))
        : null,
      imageUrl: v.imageUrl || null,
      isActive: v.isActive ?? true,
    };

    if (v.id) {
      await prisma.productVariation.update({ where: { id: v.id }, data });
    } else {
      await prisma.productVariation.create({ data: { ...data, productId: id } });
    }
  }

  const updated = await prisma.productVariation.findMany({
    where: { productId: id },
    orderBy: { sku: "asc" },
  });
  return NextResponse.json(updated);
}
