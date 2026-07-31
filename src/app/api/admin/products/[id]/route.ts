import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";
import { rupeesToPaise } from "@/lib/money";
import { DEFAULT_GST_RATE_BPS } from "@/lib/constants";
import { syncProductDefaultPriceFromVariations } from "@/lib/product-price";
import { revalidateProductCatalog } from "@/lib/revalidate-catalog";
import { normalizeBrandInput } from "@/lib/brands";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await req.json();

  const purchasePricePaise =
    body.purchasePriceRupees === "" || body.purchasePriceRupees == null
      ? null
      : rupeesToPaise(Number(body.purchasePriceRupees));
  const purchasePriceDate =
    body.purchasePriceDate === "" || body.purchasePriceDate == null
      ? null
      : new Date(body.purchasePriceDate);

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.slug || slugify(body.name),
      brand: normalizeBrandInput(body.brand),
      description: body.description,
      categoryId: body.categoryId,
      hsnCode: body.hsnCode,
      gstRateBps: DEFAULT_GST_RATE_BPS,
      defaultPricePaise:
        body.defaultPriceRupees != null
          ? rupeesToPaise(Number(body.defaultPriceRupees))
          : undefined,
      purchasePricePaise,
      purchasePriceDate:
        purchasePriceDate && !Number.isNaN(purchasePriceDate.getTime())
          ? purchasePriceDate
          : null,
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

  try {
    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });

    await prisma.$transaction(async (tx) => {
      await tx.clientPriceOverride.deleteMany({ where: { productId: id } });
      await tx.cashbackRule.deleteMany({ where: { productId: id } });
      await tx.productDiscountRule.deleteMany({ where: { productId: id } });
      await tx.clientVoucher.deleteMany({ where: { productId: id } });

      if (orderItemCount > 0) {
        await tx.product.update({
          where: { id },
          data: { isActive: false },
        });
      } else {
        await tx.productVariation.deleteMany({ where: { productId: id } });
        await tx.product.delete({ where: { id } });
      }
    });

    revalidateProductCatalog();
    return NextResponse.json({
      success: true,
      softDeleted: orderItemCount > 0,
    });
  } catch (error) {
    console.error("delete product failed", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
