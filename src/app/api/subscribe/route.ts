import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Newsletter subscription is not available" }, { status: 410 });
}
