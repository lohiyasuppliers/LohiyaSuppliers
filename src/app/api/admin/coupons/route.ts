import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { apiError, parseJsonBody } from "@/lib/api";
import { DiscountType, Role, VoucherScope } from "@prisma/client";
import { rupeesToPaise } from "@/lib/money";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const vouchers = await prisma.clientVoucher.findMany({
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          clientProfile: { select: { company: true } },
        },
      },
      product: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vouchers);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const body = await parseJsonBody<{
    clientId?: string;
    code?: string;
    scope?: string;
    productId?: string | null;
    categoryId?: string | null;
    type?: string;
    discountType?: string;
    valuePaise?: number;
    valueBps?: number;
    discountValue?: number;
    minOrderPaise?: number;
    minOrder?: number;
    maxUses?: number | null;
    expiresAt?: string | null;
    isActive?: boolean;
  }>(req);

  const clientId = String(body?.clientId || "").trim();
  const code = String(body?.code || "")
    .trim()
    .toUpperCase();
  if (!clientId || !code) return apiError("Client and code are required");

  const client = await prisma.user.findFirst({
    where: { id: clientId, role: Role.CLIENT },
  });
  if (!client) return apiError("Client not found", 404);

  const type = (body?.type || body?.discountType || "PERCENTAGE") as DiscountType;
  if (!["FIXED", "PERCENTAGE"].includes(type)) return apiError("Invalid discount type");

  const scope = (body?.scope || "WHOLE_BILL") as VoucherScope;
  if (!["WHOLE_BILL", "PRODUCT", "SERVICE"].includes(scope)) return apiError("Invalid scope");

  let valuePaise: number | null = null;
  let valueBps: number | null = null;
  if (type === "FIXED") {
    if (body?.valuePaise != null) valuePaise = Math.round(Number(body.valuePaise));
    else if (body?.discountValue != null) valuePaise = rupeesToPaise(Number(body.discountValue));
    if (!valuePaise || valuePaise <= 0) return apiError("Fixed discount amount required");
  } else {
    if (body?.valueBps != null) valueBps = Math.round(Number(body.valueBps));
    else if (body?.discountValue != null) valueBps = Math.round(Number(body.discountValue) * 100);
    if (!valueBps || valueBps <= 0) return apiError("Percentage discount required");
  }

  const minOrderPaise =
    body?.minOrderPaise != null
      ? Math.round(Number(body.minOrderPaise))
      : body?.minOrder != null
        ? rupeesToPaise(Number(body.minOrder))
        : 0;

  try {
    const voucher = await prisma.clientVoucher.create({
      data: {
        clientId,
        code,
        scope,
        productId: body?.productId || null,
        categoryId: body?.categoryId || null,
        type,
        valuePaise,
        valueBps,
        minOrderPaise,
        maxUses: body?.maxUses != null && body.maxUses !== ("" as unknown) ? Number(body.maxUses) : null,
        expiresAt: body?.expiresAt ? new Date(body.expiresAt) : null,
        isActive: body?.isActive ?? true,
      },
    });
    return NextResponse.json(voucher, { status: 201 });
  } catch (err) {
    console.error("Create voucher failed:", err);
    return apiError("Failed to create voucher (code may already exist for this client)", 400);
  }
}
