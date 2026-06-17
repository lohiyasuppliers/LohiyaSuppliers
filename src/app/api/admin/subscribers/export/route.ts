import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Subscribers export is not available" }, { status: 410 });
}
