import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json({ error: "Inquiries are not available" }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Inquiries are not available" }, { status: 410 });
}
