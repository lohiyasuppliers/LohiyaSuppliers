import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { resolvePrice } from "@/lib/pricing";
import { OrderType, Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: Role }).role !== Role.CLIENT) {
      return NextResponse.json({ error: "Client login required to place orders" }, { status: 401 });
    }

    const clientId = (session.user as { id: string }).id;
    const body = await req.json();
    const { items, notes, orderType } = body as {
      items: { productId: string; variationId?: string; quantity: number }[];
      notes?: string;
      orderType?: OrderType;
    };

    if (!items?.length) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    const [profile, user] = await Promise.all([
      prisma.clientProfile.findUnique({ where: { userId: clientId } }),
      prisma.user.findUnique({ where: { id: clientId }, select: { phone: true, name: true, email: true } }),
    ]);

    if (!profile) {
      return NextResponse.json({ error: "Complete your company profile before ordering" }, { status: 400 });
    }

    let subtotalPaise = 0;
    let taxPaise = 0;
    const orderItems: {
      productId: string;
      variationId: string | null;
      productName: string;
      variationLabel: string | null;
      hsnCode: string;
      gstRateBps: number;
      quantity: number;
      unitPricePaise: number;
      totalPaise: number;
    }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId, isActive: true },
        include: {
          variations: item.variationId
            ? { where: { id: item.variationId, isActive: true } }
            : undefined,
        },
      });

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 400 });
      }

      const variation = item.variationId
        ? product.variations?.find((v) => v.id === item.variationId)
        : undefined;

      if (item.variationId && !variation) {
        return NextResponse.json({ error: "Variation not found" }, { status: 400 });
      }

      const unitPricePaise = await resolvePrice({
        clientId,
        productId: product.id,
        variationId: item.variationId,
      });

      const lineTotal = unitPricePaise * item.quantity;
      const lineTax = Math.round((lineTotal * product.gstRateBps) / 10000);

      subtotalPaise += lineTotal;
      taxPaise += lineTax;

      const attrs = variation?.attributes as Record<string, string> | undefined;
      const variationLabel = attrs ? Object.values(attrs).join(" · ") : null;

      orderItems.push({
        productId: product.id,
        variationId: variation?.id ?? null,
        productName: product.name,
        variationLabel,
        hsnCode: product.hsnCode,
        gstRateBps: product.gstRateBps,
        quantity: item.quantity,
        unitPricePaise,
        totalPaise: lineTotal,
      });
    }

    const totalPaise = subtotalPaise + taxPaise;

    const shippingAddress = {
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      company: profile.company,
      address: profile.address,
      city: profile.city,
      state: profile.billingState,
      pincode: profile.pincode,
      country: profile.country,
      gstin: profile.gstin,
    };

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        clientId,
        orderType: orderType || OrderType.PREPAID,
        subtotalPaise,
        taxPaise,
        totalPaise,
        shippingAddress,
        notes: notes || null,
        items: { create: orderItems },
      },
    });

    return NextResponse.json({ orderNumber: order.orderNumber, id: order.id });
  } catch (err) {
    console.error("Order creation failed:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: Role }).role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    include: {
      client: { select: { name: true, email: true, phone: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
