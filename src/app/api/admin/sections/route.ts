import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([]);
}

export async function POST() {
  return NextResponse.json({ error: "Page sections are not available" }, { status: 410 });
}
