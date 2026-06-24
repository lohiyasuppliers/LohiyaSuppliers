import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";
import { rupeesToPaise } from "@/lib/money";
import { DEFAULT_GST_RATE_BPS } from "@/lib/constants";
import { syncProductDefaultPriceFromVariations } from "@/lib/product-price";
import { revalidateProductCatalog } from "@/lib/revalidate-catalog";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await req.json();

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.slug || slugify(body.name),
      brand: body.brand,
      description: body.description,
      categoryId: body.categoryId,
      hsnCode: body.hsnCode,
      gstRateBps: DEFAULT_GST_RATE_BPS,
      defaultPricePaise:
        body.defaultPriceRupees != null
          ? rupeesToPaise(Number(body.defaultPriceRupees))
          : undefined,
      images: body.images,
      isActive: body.isActive,
    },
  });

  await syncProductDefaultPriceFromVariations(id);
  revalidateProductCatalog();

  return NextResponse.json(product);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  revalidateProductCatalog();
  return NextResponse.json({ success: true });
}
