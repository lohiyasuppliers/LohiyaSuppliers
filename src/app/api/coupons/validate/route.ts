import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Coupons are not available in B2B mode" }, { status: 410 });
}
