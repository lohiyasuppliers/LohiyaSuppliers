import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";
import { rupeesToPaise } from "@/lib/money";
import { DEFAULT_GST_RATE_BPS } from "@/lib/constants";
import { revalidateProductCatalog } from "@/lib/revalidate-catalog";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const body = await req.json();
  const slug = body.slug || slugify(body.name);

  if (!body.name || !body.categoryId || !body.hsnCode || body.defaultPriceRupees == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug,
      brand: body.brand || null,
      description: body.description || "",
      categoryId: body.categoryId,
      hsnCode: body.hsnCode,
      gstRateBps: body.gstRateBps ?? DEFAULT_GST_RATE_BPS,
      defaultPricePaise: rupeesToPaise(Number(body.defaultPriceRupees)),
      images: body.images || "[]",
      isActive: body.isActive ?? true,
    },
  });

  revalidateProductCatalog();
  return NextResponse.json(product);
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const products = await prisma.product.findMany({
    include: { category: true, _count: { select: { variations: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}
