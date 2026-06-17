import { NextResponse } from "next/server";

export async function PUT() {
  return NextResponse.json({ error: "Page sections are not available" }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Page sections are not available" }, { status: 410 });
}
