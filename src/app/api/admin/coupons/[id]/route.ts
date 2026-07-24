import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { apiError, parseJsonBody } from "@/lib/api";
import { DiscountType, VoucherScope } from "@prisma/client";
import { rupeesToPaise } from "@/lib/money";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;

  const existing = await prisma.clientVoucher.findUnique({ where: { id } });
  if (!existing) return apiError("Voucher not found", 404);

  const body = await parseJsonBody<{
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

  const type = (body?.type || body?.discountType || existing.type) as DiscountType;
  const scope = (body?.scope || existing.scope) as VoucherScope;

  let valuePaise = existing.valuePaise;
  let valueBps = existing.valueBps;
  if (type === "FIXED") {
    if (body?.valuePaise != null) valuePaise = Math.round(Number(body.valuePaise));
    else if (body?.discountValue != null) valuePaise = rupeesToPaise(Number(body.discountValue));
    valueBps = null;
  } else if (type === "PERCENTAGE") {
    if (body?.valueBps != null) valueBps = Math.round(Number(body.valueBps));
    else if (body?.discountValue != null) valueBps = Math.round(Number(body.discountValue) * 100);
    valuePaise = null;
  }

  const minOrderPaise =
    body?.minOrderPaise != null
      ? Math.round(Number(body.minOrderPaise))
      : body?.minOrder != null
        ? rupeesToPaise(Number(body.minOrder))
        : existing.minOrderPaise;

  try {
    const voucher = await prisma.clientVoucher.update({
      where: { id },
      data: {
        ...(body?.code !== undefined ? { code: String(body.code).trim().toUpperCase() } : {}),
        scope,
        productId: body?.productId !== undefined ? body.productId || null : undefined,
        categoryId: body?.categoryId !== undefined ? body.categoryId || null : undefined,
        type,
        valuePaise,
        valueBps,
        minOrderPaise,
        ...(body?.maxUses !== undefined
          ? { maxUses: body.maxUses == null || body.maxUses === ("" as unknown) ? null : Number(body.maxUses) }
          : {}),
        ...(body?.expiresAt !== undefined
          ? { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }
          : {}),
        ...(body?.isActive !== undefined ? { isActive: !!body.isActive } : {}),
      },
    });
    return NextResponse.json(voucher);
  } catch (err) {
    console.error("Update voucher failed:", err);
    return apiError("Failed to update voucher", 400);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;
  const { id } = await params;

  const existing = await prisma.clientVoucher.findUnique({ where: { id } });
  if (!existing) return apiError("Voucher not found", 404);

  await prisma.clientVoucher.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
