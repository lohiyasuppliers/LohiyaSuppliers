import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Banners are not available" }, { status: 410 });
}

export async function GET() {
  return NextResponse.json([], { status: 200 });
}
