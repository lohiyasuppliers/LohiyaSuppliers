import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, parseJsonBody } from "@/lib/api";
import { buildCheckoutQuote, creditOrderCashbackIfEligible } from "@/lib/checkout-totals";
import { applyCashbackAtCheckout } from "@/lib/cashback-wallet";
import { generateOrderNumber } from "@/lib/utils";
import { paymentStateFromPaid, isValidPaymentProof, type PaymentProofInput } from "@/lib/payable-orders";
import { OrderType, PaymentStatus, Role } from "@prisma/client";

interface OrderItemInput {
  productId: string;
  variationId?: string;
  quantity: number;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: Role }).role !== Role.CLIENT) {
      return apiError("Client login required to place orders", 401);
    }

    const clientId = (session.user as { id: string }).id;
    const body = await parseJsonBody<{
      items: OrderItemInput[];
      notes?: string;
      paidPaise?: number;
      proof?: PaymentProofInput;
      applyCashbackPaise?: number;
      useCashback?: boolean;
      useDiscount?: boolean;
      useWalletBalance?: boolean;
    }>(req);
    if (!body) return apiError("Invalid request body");

    const { items, notes, paidPaise: paidNowPaise = 0, useCashback, useDiscount, useWalletBalance } = body;

    if (!items?.length) return apiError("No items in order");

    if (useDiscount && useCashback) {
      return apiError("Choose discount or cashback — you cannot use both on the same order", 400);
    }

    if (useDiscount && paidNowPaise <= 0) {
      return apiError("Orders with discount must be paid now. Please scan and pay.", 400);
    }

    const [profile, user] = await Promise.all([
      prisma.clientProfile.findUnique({ where: { userId: clientId } }),
      prisma.user.findUnique({
        where: { id: clientId },
        select: { phone: true, name: true, email: true, isActive: true },
      }),
    ]);

    if (!user?.isActive) return apiError("Account is inactive", 403);
    if (!profile) return apiError("Complete your company profile before ordering");

    const quote = await buildCheckoutQuote(clientId, items, {
      useDiscount: body.useDiscount,
      useCashback: body.useCashback,
      applyCashbackPaise: body.applyCashbackPaise,
      useWalletBalance: body.useWalletBalance,
    });

    const totalPaise = quote.payableTotalPaise;

    if (paidNowPaise < 0 || paidNowPaise > totalPaise) {
      return apiError("Invalid payment amount", 400);
    }

    if (paidNowPaise > 0 && !isValidPaymentProof(body.proof)) {
      return apiError("Payment screenshot is required", 400);
    }

    const paymentId = paidNowPaise > 0 ? `SCANNER_DEMO_${Date.now()}` : undefined;
    const paymentProof =
      paidNowPaise > 0 && body.proof
        ? JSON.stringify({
            paymentId,
            amountPaise: paidNowPaise,
            screenshot: body.proof.screenshot ?? null,
            submittedAt: new Date().toISOString(),
          })
        : null;

    const paymentStatus =
      paidNowPaise > 0
        ? PaymentStatus.PENDING_VERIFICATION
        : paymentStateFromPaid(totalPaise, 0).paymentStatus;

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

    const paidFullAtCheckout = paidNowPaise >= totalPaise && totalPaise > 0;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          clientId,
          orderType: OrderType.POSTPAID,
          paymentStatus,
          paidPaise: 0,
          pendingPaymentPaise: paidNowPaise > 0 ? paidNowPaise : 0,
          paymentProof,
          razorpayPaymentId: paymentId ?? null,
          subtotalPaise: quote.subtotalPaise,
          taxPaise: quote.taxPaise,
          discountPaise: quote.discountPaise,
          cashbackAppliedPaise: 0,
          walletAppliedPaise: quote.walletAppliedPaise,
          cashbackEarnedPaise: quote.cashbackToLockPaise,
          totalPaise,
          shippingAddress,
          notes: notes || null,
          items: { create: quote.orderItems },
        },
      });

      await creditOrderCashbackIfEligible(
        clientId,
        created.id,
        quote.cashbackToEarnPaise,
        paidFullAtCheckout,
        !!useDiscount,
        !!useCashback,
        tx
      );

      if (quote.walletAppliedPaise > 0) {
        await applyCashbackAtCheckout(clientId, quote.walletAppliedPaise, created.id, tx);
      }

      return created;
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      id: order.id,
      paidPaise: order.paidPaise,
      pendingPaymentPaise: order.pendingPaymentPaise,
      paymentStatus: order.paymentStatus,
      awaitingAdmin: order.pendingPaymentPaise > 0,
      discountPaise: quote.discountPaise,
      cashbackAppliedPaise: 0,
      walletAppliedPaise: quote.walletAppliedPaise,
      cashbackEarnedPaise: quote.cashbackToLockPaise,
      payableTotalPaise: totalPaise,
    });
  } catch (err) {
    console.error("Order creation failed:", err);
    return apiError(err instanceof Error ? err.message : "Failed to create order", 500);
  }
}

// Keep GET for admin order list
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: Role }).role !== Role.ADMIN) {
    return apiError("Unauthorized", 401);
  }

  const orders = await prisma.order.findMany({
    include: {
      client: {
        select: {
          name: true,
          email: true,
          phone: true,
          clientProfile: { select: { company: true } },
        },
      },
      items: { select: { productName: true, quantity: true, totalPaise: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(orders);
}
