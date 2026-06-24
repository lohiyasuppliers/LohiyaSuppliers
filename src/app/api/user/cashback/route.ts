import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchCashbackWalletData } from "@/lib/cashback-page-data";
import { redeemWalletCashback } from "@/lib/cashback-wallet";
import { CashbackRedemptionType, Role } from "@prisma/client";
import { rupeesToPaise, paiseToRupees } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await fetchCashbackWalletData(session.user.id);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Cashback GET failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load wallet" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { amountRupees, type, upiId, clientNote } = body as {
    amountRupees: number;
    type: "UPI" | "AMAZON_VOUCHER";
    upiId?: string;
    clientNote?: string;
  };

  const amountPaise = rupeesToPaise(Number(amountRupees));
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  }

  const wallet = await fetchCashbackWalletData(session.user.id);
  if (amountPaise > wallet.availablePaise) {
    return NextResponse.json(
      {
        error: `Maximum redeemable: ₹${paiseToRupees(wallet.availablePaise).toLocaleString("en-IN")}`,
      },
      { status: 400 }
    );
  }

  const redemptionType =
    type === "UPI"
      ? CashbackRedemptionType.UPI
      : CashbackRedemptionType.AMAZON_VOUCHER;

  try {
    const result = await redeemWalletCashback(
      session.user.id,
      amountPaise,
      redemptionType,
      { upiId, clientNote }
    );
    return NextResponse.json({
      success: true,
      message:
        type === "UPI"
          ? "UPI redemption submitted. Admin will verify and send payment proof once processed."
          : "Gift card request submitted. Admin will send your code after approval.",
      ...result,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Redemption failed" },
      { status: 400 }
    );
  }
}
